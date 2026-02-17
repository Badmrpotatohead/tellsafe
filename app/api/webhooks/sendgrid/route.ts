// ============================================================
// TellSafe — Inbound Email Webhook (SendGrid Inbound Parse)
// ============================================================
// POST /api/webhooks/sendgrid
//
// When a member replies to a relay email, SendGrid forwards it here.
// The relay+{threadId}@tellsafe.app address encodes the thread.
// We extract the message, strip the member's identity, and add it
// to the Firestore thread.

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminCollections } from "../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    // SendGrid sends form-encoded data
    const formData = await request.formData();

    const to = formData.get("to") as string; // relay+{threadId}@tellsafe.app
    const text = formData.get("text") as string; // plain text body
    const html = formData.get("html") as string; // HTML body (fallback)

    if (!to || (!text && !html)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Extract threadId from the "to" address
    // Format: relay+THREAD_ID@tellsafe.app
    const threadIdMatch = to.match(/relay\+([^@]+)@/);
    if (!threadIdMatch) {
      console.error("Could not extract threadId from:", to);
      return NextResponse.json(
        { error: "Invalid relay address" },
        { status: 400 }
      );
    }

    const threadId = threadIdMatch[1];

    // Clean the reply text — strip quoted content from email chains
    const cleanText = stripEmailQuotes(text || htmlToPlainText(html));

    if (!cleanText.trim()) {
      console.log("Empty reply after stripping quotes, ignoring.");
      return NextResponse.json({ status: "ignored", reason: "empty" });
    }

    // Find the thread across all orgs
    // In production, you'd encode the orgId in the relay address too
    // For now, query across orgs (fine at our scale)
    const orgsSnap = await adminDb.collection("organizations").get();

    let found = false;
    for (const orgDoc of orgsSnap.docs) {
      const threadSnap = await adminCollections
        .thread(orgDoc.id, threadId)
        .get();

      if (threadSnap.exists) {
        const thread = threadSnap.data();

        // Don't add messages to closed threads
        if (thread?.status === "closed") {
          return NextResponse.json({
            status: "ignored",
            reason: "thread_closed",
          });
        }

        // Add the member's message
        await adminCollections.messages(orgDoc.id, threadId).add({
          from: "member",
          authorName: null,
          text: cleanText.trim(),
          createdAt: new Date().toISOString(),
        });

        // Update thread metadata
        await adminCollections.thread(orgDoc.id, threadId).update({
          messageCount: FieldValue.increment(1),
          lastMessageAt: new Date().toISOString(),
        });

        // Update feedback status back to needs_reply
        if (thread?.feedbackId) {
          await adminCollections
            .feedbackDoc(orgDoc.id, thread.feedbackId)
            .update({
              status: "needs_reply",
              updatedAt: new Date().toISOString(),
            });
        }

        found = true;
        break;
      }
    }

    if (!found) {
      console.error("Thread not found:", threadId);
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Inbound webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Strip quoted email replies.
 * Most email clients add "On [date], [person] wrote:" before the quoted text.
 * We want only the new content.
 */
function stripEmailQuotes(text: string): string {
  if (!text) return "";

  const lines = text.split("\n");
  const cleanLines: string[] = [];

  for (const line of lines) {
    // Stop at common quote markers
    if (
      line.match(/^On .+ wrote:$/i) ||
      line.match(/^>/) ||
      line.match(/^-{3,}/) ||
      line.match(/^_{3,}/) ||
      line.match(/^From:/) ||
      line.match(/^Sent:/) ||
      line.match(/^To:/) ||
      line.match(/^Subject:/)
    ) {
      break;
    }
    cleanLines.push(line);
  }

  return cleanLines.join("\n").trim();
}

/**
 * Simple HTML to plain text conversion.
 * Used as fallback when plain text body is missing.
 */
function htmlToPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}
