// ============================================================
// TellSafe v1.2 — Feedback Submission API Route
// ============================================================
// Handles feedback submission server-side so we can:
// 1. Run sentiment analysis (Claude API — server-only)
// 2. Encrypt relay emails (server-only)
// 3. Send email notifications to admins (SendGrid — server-only)
// 4. Enforce submission limits

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminCollections } from "../../../lib/firebase-admin";
import { analyzeSentiment } from "../../../lib/sentiment";
import { encryptEmail } from "../../../lib/encryption";
import {
  sendRelayConfirmation,
  sendNewFeedbackNotification,
} from "../../../lib/sendgrid";
import type {
  Organization,
  Plan,
  FeedbackStatus,
  SubmitFeedbackRequest,
} from "../../../types";
import { PLAN_LIMITS } from "../../../types";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitFeedbackRequest & {
      orgId: string;
    };

    const { orgId, type, categories, text, authorName, authorEmail, relayEmail } =
      body;

    // --- Validate ---
    if (!orgId || !type || !text?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- Get org ---
    const orgSnap = await adminCollections.organization(orgId).get();
    if (!orgSnap.exists) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }
    const org = { id: orgSnap.id, ...orgSnap.data() } as Organization;

    // --- Check submission limits ---
    const limits = PLAN_LIMITS[org.plan];
    if (
      limits.maxSubmissionsPerMonth !== Infinity &&
      org.submissionCount >= limits.maxSubmissionsPerMonth
    ) {
      return NextResponse.json(
        { error: "This organization has reached its monthly submission limit." },
        { status: 429 }
      );
    }

    // --- Check relay is allowed ---
    if (type === "relay" && !limits.hasRelay) {
      return NextResponse.json(
        { error: "Anonymous relay is not available on the free plan." },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // --- Build feedback document ---
    const feedbackData: Record<string, any> = {
      type,
      categories: categories || [],
      text: text.trim(),
      status: "new" as FeedbackStatus,
      sentimentScore: null,
      sentimentLabel: null,
      createdAt: now,
      updatedAt: now,
    };

    if (type === "identified") {
      feedbackData.authorName = authorName || "";
      feedbackData.authorEmail = authorEmail || "";
    }

    // --- Relay: encrypt email + create thread ---
    let threadId: string | undefined;

    if (type === "relay" && relayEmail) {
      const encrypted = encryptEmail(relayEmail);
      feedbackData.encryptedEmail = encrypted;
      feedbackData.status = "needs_reply";

      // Create relay thread
      const threadRef = adminCollections.threads(orgId).doc();
      threadId = threadRef.id;

      await threadRef.set({
        feedbackId: "", // will update after feedback doc is created
        status: "active",
        messageCount: 1,
        lastMessageAt: now,
        createdAt: now,
      });

      feedbackData.threadId = threadId;
    }

    // --- Run sentiment analysis (all plans in v1.2 — basic labeling is free, detailed scores are Pro) ---
    try {
      const sentiment = await analyzeSentiment(
        text.trim(),
        categories?.[0] || "General"
      );
      feedbackData.sentimentScore = sentiment.score;
      feedbackData.sentimentLabel = sentiment.label;

      // Auto-escalate urgent feedback
      if (sentiment.label === "urgent") {
        feedbackData.status = "needs_reply";
      }
    } catch (err) {
      console.error("Sentiment analysis failed (non-blocking):", err);
    }

    // --- Write feedback to Firestore ---
    const feedbackRef = await adminCollections.feedback(orgId).add(feedbackData);
    const feedbackId = feedbackRef.id;

    // --- Update thread with feedbackId ---
    if (threadId) {
      await adminCollections.thread(orgId, threadId).update({
        feedbackId,
      });

      // Add initial message to thread
      await adminCollections.messages(orgId, threadId).add({
        from: "member",
        authorName: null,
        text: text.trim(),
        createdAt: now,
      });

      // Send relay confirmation email
      try {
        await sendRelayConfirmation({
          memberEmail: relayEmail!,
          orgName: org.name,
          threadId,
        });
      } catch (err) {
        console.error("Relay confirmation email failed:", err);
      }
    }

    // --- Increment submission count ---
    await adminCollections.organization(orgId).update({
      submissionCount: FieldValue.increment(1),
    });

    // --- Notify admins via email ---
    try {
      const adminsSnap = await adminCollections.admins(orgId).get();
      const adminEmails = adminsSnap.docs
        .map((d) => d.data().email)
        .filter(Boolean) as string[];

      if (adminEmails.length > 0) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://tellsafe.vercel.app";

        await sendNewFeedbackNotification({
          adminEmails,
          orgName: org.name,
          feedbackType: type,
          category: categories?.[0] || "General",
          previewText: text.trim().substring(0, 150),
          dashboardUrl: `${appUrl}/admin`,
        });
      }
    } catch (err) {
      console.error("Admin notification email failed:", err);
    }

    return NextResponse.json({
      success: true,
      feedbackId,
      threadId,
      sentiment: feedbackData.sentimentLabel
        ? {
            label: feedbackData.sentimentLabel,
            score: feedbackData.sentimentScore,
          }
        : null,
    });
  } catch (err) {
    console.error("Feedback submission error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
