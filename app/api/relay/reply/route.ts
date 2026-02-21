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

    // ── Verify admin is a member of this org ──────────────────
    const memberSnap = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("members")
      .doc(decoded.uid)
      .get();

    if (!memberSnap.exists) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      // Survey relay: find the response that has this threadId
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
        await sendRelayReply({
          memberEmail,
          orgName,
          threadId,
          adminName: authorName || "Organizer",
          replyText: text.trim(),
        });
      } catch (emailErr) {
        // Non-fatal: message is already saved to Firestore
        console.error("[relay/reply] Failed to send email:", emailErr);
      }
    } else {
      console.warn(`[relay/reply] No encrypted email found for thread ${threadId}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Relay reply error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
