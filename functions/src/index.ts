// ============================================================
// TellSafe — Cloud Functions
// ============================================================
// Serverless functions that handle:
// 1. Organization creation (slug uniqueness)
// 2. Feedback submission processing (encrypt relay emails, sentiment, notifications)
// 3. Admin reply → email relay
// 4. Inbound email → thread message

import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminCollections } from "../lib/firebase-admin";
import { encryptEmail, decryptEmail } from "../lib/encryption";
import { analyzeSentiment } from "../lib/sentiment";
import {
  sendRelayConfirmation,
  sendRelayReply,
  sendNewFeedbackNotification,
} from "../lib/email";
import type {
  Organization,
  Feedback,
  RelayThread,
  Plan,
  PLAN_LIMITS,
} from "../types";

// ============================================================
// 1. CREATE ORGANIZATION
// ============================================================
// Called from the signup flow. Ensures slug uniqueness and sets
// up the initial org document + owner admin record.

export const createOrganization = functions.https.onCall(
  async (data, context) => {
    // Must be authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in to create an organization."
      );
    }

    const { name, slug } = data as { name: string; slug: string };

    // Validate slug format
    const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
    if (!slugRegex.test(slug)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Slug must be 3-50 characters, lowercase alphanumeric and hyphens only."
      );
    }

    // Check slug uniqueness
    const slugDoc = await adminDb.collection("slugs").doc(slug).get();
    if (slugDoc.exists) {
      throw new functions.https.HttpsError(
        "already-exists",
        "This URL is already taken. Try a different one."
      );
    }

    // Create org + slug + admin in a batch
    const batch = adminDb.batch();
    const orgRef = adminCollections.organizations().doc();
    const now = new Date().toISOString();

    // Organization document
    batch.set(orgRef, {
      name,
      slug,
      logoUrl: null,
      primaryColor: "#2d6a6a",
      accentColor: "#c05d3b",
      tagline: "Your voice matters. Share your feedback anonymously.",
      categories: [
        { emoji: "💡", label: "Suggestion" },
        { emoji: "❤️", label: "Praise" },
        { emoji: "🤝", label: "Safety" },
        { emoji: "💬", label: "Other" },
      ],
      plan: "free" as Plan,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      ownerId: context.auth.uid,
      submissionCount: 0,
      submissionResetDate: getNextMonthReset(),
      createdAt: now,
      updatedAt: now,
    });

    // Slug lookup document
    batch.set(adminDb.collection("slugs").doc(slug), {
      orgId: orgRef.id,
    });

    // Owner admin record
    batch.set(
      adminCollections.admins(orgRef.id).doc(context.auth.uid),
      {
        email: context.auth.token.email || "",
        displayName: context.auth.token.name || "Owner",
        role: "owner",
        joinedAt: now,
      }
    );

    await batch.commit();

    return { orgId: orgRef.id, slug };
  }
);

// ============================================================
// 2. PROCESS FEEDBACK SUBMISSION
// ============================================================
// Triggered when a new feedback document is created.
// Handles: relay email encryption, sentiment analysis, notifications.

export const processFeedback = functions.firestore
  .document("organizations/{orgId}/feedback/{feedbackId}")
  .onCreate(async (snap, context) => {
    const { orgId, feedbackId } = context.params;
    const feedback = snap.data() as Feedback;

    // Get org data
    const orgSnap = await adminCollections.organization(orgId).get();
    if (!orgSnap.exists) return;
    const org = orgSnap.data() as Organization;

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    // --- Handle relay email encryption ---
    if (feedback.type === "relay" && (feedback as any).relayEmailPlaintext) {
      const plainEmail = (feedback as any).relayEmailPlaintext;

      // Encrypt the email
      const encryptedEmail = encryptEmail(plainEmail);
      updates.encryptedEmail = encryptedEmail;

      // Remove the plaintext email (it was only sent temporarily)
      updates.relayEmailPlaintext = FieldValue.delete();

      // Create the relay thread
      const threadRef = adminCollections.threads(orgId).doc();
      const now = new Date().toISOString();

      await threadRef.set({
        feedbackId,
        status: "active",
        messageCount: 1,
        lastMessageAt: now,
        createdAt: now,
      });

      // Add the initial message to the thread
      await adminCollections.messages(orgId, threadRef.id).add({
        from: "member",
        authorName: null,
        text: feedback.text,
        createdAt: now,
      });

      updates.threadId = threadRef.id;
      updates.status = "needs_reply";

      // Send confirmation email to member
      try {
        await sendRelayConfirmation({
          memberEmail: plainEmail,
          orgName: org.name,
          threadId: threadRef.id,
        });
      } catch (err) {
        console.error("Failed to send relay confirmation:", err);
      }
    }

    // --- Sentiment analysis (Pro plan only) ---
    if (org.plan === "pro") {
      try {
        const sentiment = await analyzeSentiment(
          feedback.text,
          feedback.categories?.[0] || "General"
        );
        updates.sentimentScore = sentiment.score;
        updates.sentimentLabel = sentiment.label;

        // Auto-escalate urgent feedback
        if (sentiment.label === "urgent" && feedback.status === "new") {
          updates.status = "needs_reply";
        }
      } catch (err) {
        console.error("Sentiment analysis failed:", err);
      }
    }

    // --- Update submission count ---
    await adminCollections.organization(orgId).update({
      submissionCount: FieldValue.increment(1),
    });

    // --- Apply updates ---
    await snap.ref.update(updates);

    // --- Notify admins ---
    try {
      const adminsSnap = await adminCollections.admins(orgId).get();
      const adminEmails = adminsSnap.docs.map((d) => d.data().email).filter(Boolean);

      if (adminEmails.length > 0) {
        await sendNewFeedbackNotification({
          adminEmails,
          orgName: org.name,
          feedbackType: feedback.type,
          category: feedback.categories?.[0] || "General",
          previewText: feedback.text.substring(0, 150),
          dashboardUrl: `https://tellsafe.app/admin?org=${orgId}`,
        });
      }
    } catch (err) {
      console.error("Failed to send admin notification:", err);
    }
  });

// ============================================================
// 3. ADMIN REPLY → EMAIL RELAY
// ============================================================
// Triggered when an admin adds a message to a relay thread.
// Decrypts the member's email and forwards the reply.

export const processAdminReply = functions.firestore
  .document("organizations/{orgId}/threads/{threadId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const { orgId, threadId } = context.params;
    const message = snap.data();

    // Only process admin messages (member messages come from inbound email)
    if (message.from !== "admin") return;

    // Get the thread to find the feedback doc
    const threadSnap = await adminCollections.thread(orgId, threadId).get();
    if (!threadSnap.exists) return;
    const thread = threadSnap.data() as RelayThread;

    // Get the feedback doc to find the encrypted email
    const feedbackSnap = await adminCollections
      .feedbackDoc(orgId, thread.feedbackId)
      .get();
    if (!feedbackSnap.exists) return;
    const feedback = feedbackSnap.data();

    if (!feedback?.encryptedEmail) {
      console.error("No encrypted email found for relay feedback");
      return;
    }

    // Get org name
    const orgSnap = await adminCollections.organization(orgId).get();
    const org = orgSnap.data() as Organization;

    // Decrypt the member's email
    const memberEmail = decryptEmail(feedback.encryptedEmail);

    // Send the relay reply
    try {
      await sendRelayReply({
        memberEmail,
        orgName: org.name,
        threadId,
        adminName: message.authorName || "An organizer",
        replyText: message.text,
      });
    } catch (err) {
      console.error("Failed to send relay reply:", err);
    }

    // Update thread metadata
    await adminCollections.thread(orgId, threadId).update({
      messageCount: FieldValue.increment(1),
      lastMessageAt: new Date().toISOString(),
    });

    // Update feedback status
    await adminCollections.feedbackDoc(orgId, thread.feedbackId).update({
      status: "replied",
      updatedAt: new Date().toISOString(),
    });
  });

// ============================================================
// 4. MONTHLY SUBMISSION COUNT RESET
// ============================================================
// Runs daily, resets submission counts for orgs past their reset date.

export const resetSubmissionCounts = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const now = new Date().toISOString();
    const orgsSnap = await adminCollections
      .organizations()
      .where("submissionResetDate", "<=", now)
      .get();

    const batch = adminDb.batch();
    orgsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        submissionCount: 0,
        submissionResetDate: getNextMonthReset(),
      });
    });

    await batch.commit();
    console.log(`Reset submission counts for ${orgsSnap.size} organizations.`);
  });

// ============================================================
// Helpers
// ============================================================

function getNextMonthReset(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString();
}
