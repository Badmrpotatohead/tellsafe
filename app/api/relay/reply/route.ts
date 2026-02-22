// ============================================================
// TellSafe — Relay Admin Reply API
// ============================================================
// POST: Send an admin reply in a relay thread.
// Writes the message to Firestore AND emails the member
// via Resend after decrypting their stored email.
//
// Auth: Bearer token (admin must be a member of the org)
// Body: { orgId, threadId, text, authorName }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { decryptEmail } from "../../../../lib/encryption";
import { sendRelayReply } from "../../../../lib/email";

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: { uid: string; email?: string };
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { orgId, threadId, text, authorName } = await request.json();

    if (!orgId || !threadId || !text?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json({ error: "Reply text is too long (max 10,000 characters)." }, { status: 400 });
    }

    // ── Verify admin is a member of this org ──────────────────
    const memberSnap = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("admins")
      .doc(decoded.uid)
      .get();

    if (!memberSnap.exists) {
      // Fallback: check if user is the org owner
      const orgOwnerSnap = await adminDb.collection("organizations").doc(orgId).get();
      if (!orgOwnerSnap.exists || orgOwnerSnap.data()?.ownerId !== decoded.uid) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Load org name ─────────────────────────────────────────
    const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
    const orgName = orgSnap.data()?.name || "Your organization";

    // ── Write message to Firestore ────────────────────────────
    const now = new Date().toISOString();
    await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("threads")
      .doc(threadId)
      .collection("messages")
      .add({
        from: "admin",
        authorName: authorName || "Organizer",
        text: text.trim(),
        createdAt: now,
      });

    // Update thread metadata
    await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("threads")
      .doc(threadId)
      .update({
        lastMessageAt: now,
        messageCount: (await adminDb
          .collection("organizations")
          .doc(orgId)
          .collection("threads")
          .doc(threadId)
          .collection("messages")
          .count()
          .get()).data().count,
      });

    // ── Find the member's encrypted email ─────────────────────
    // Check thread doc first (survey relay threads store feedbackId/surveyId)
    const threadSnap = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("threads")
      .doc(threadId)
      .get();

    const threadData = threadSnap.data();
    let encryptedEmail: string | null = null;

    if (threadData?.source === "survey" && threadData?.surveyId) {
      // Fast path: encrypted email stored directly on the thread doc (new threads)
      if (threadData.encryptedEmail) {
        encryptedEmail = threadData.encryptedEmail;
      } else {
        // Legacy fallback: query the survey response subcollection by threadId
        console.warn(`[relay/reply] Thread ${threadId} has no encryptedEmail field — falling back to subcollection query`);
        const responsesSnap = await adminDb
          .collection("organizations")
          .doc(orgId)
          .collection("surveys")
          .doc(threadData.surveyId)
          .collection("responses")
          .where("threadId", "==", threadId)
          .limit(1)
          .get();

        if (!responsesSnap.empty) {
          encryptedEmail = responsesSnap.docs[0].data().encryptedEmail || null;
        } else if (threadData.responseId) {
          // Second fallback: direct doc lookup via stored responseId
          console.warn(`[relay/reply] Subcollection query empty — trying responseId direct lookup`);
          const responseSnap = await adminDb
            .collection("organizations")
            .doc(orgId)
            .collection("surveys")
            .doc(threadData.surveyId)
            .collection("responses")
            .doc(threadData.responseId)
            .get();
          encryptedEmail = responseSnap.data()?.encryptedEmail || null;
          if (!encryptedEmail) {
            console.warn(`[relay/reply] All lookups exhausted — no encryptedEmail for thread ${threadId}`);
          }
        } else {
          console.warn(`[relay/reply] No encryptedEmail, no threadId match, no responseId on thread ${threadId}`);
        }
      }
    } else if (threadData?.feedbackId) {
      // Regular feedback relay thread
      const feedbackSnap = await adminDb
        .collection("organizations")
        .doc(orgId)
        .collection("feedback")
        .doc(threadData.feedbackId)
        .get();

      encryptedEmail = feedbackSnap.data()?.encryptedEmail || null;
    }

    // ── Send email to member ───────────────────────────────────
    if (encryptedEmail) {
      try {
        const memberEmail = decryptEmail(encryptedEmail);
        console.log(`[relay/reply] Sending relay email for thread ${threadId}`);
        await sendRelayReply({
          memberEmail,
          orgName,
          threadId,
          adminName: authorName || "Organizer",
          replyText: text.trim(),
        });
        console.log(`[relay/reply] Email sent successfully for thread ${threadId}`);
      } catch (emailErr) {
        // Non-fatal: message is already saved to Firestore
        console.error("[relay/reply] Failed to send email:", emailErr);
      }
    } else {
      console.warn(`[relay/reply] No encrypted email found for thread ${threadId} — member will not receive email notification`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Relay reply error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
