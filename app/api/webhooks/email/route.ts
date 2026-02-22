// ============================================================
// TellSafe — Inbound Email Webhook (Resend Inbound Parse)
// ============================================================
// POST /api/webhooks/email
//
// When a member replies to a relay email, Resend forwards an
// email.received event here. The relay+{threadId}@tellsafe.app
// address encodes the thread. We fetch the email body from
// Resend, extract the reply, strip quotes, and add it to
// the Firestore thread.

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { adminDb, adminCollections } = await import(
      "../../../../lib/firebase-admin"
    );
    const { FieldValue } = await import("firebase-admin/firestore");

    // Resend sends JSON
    const body = await request.json();

    console.log("[inbound] Received webhook type:", body?.type);

    // Only handle email.received events
    if (body?.type !== "email.received") {
      return NextResponse.json({ status: "ignored", reason: "wrong_event_type" });
    }

    const data = body?.data;
    const emailId = data?.email_id;
    const toAddresses: string[] = data?.to ?? [];

    if (!emailId || toAddresses.length === 0) {
      console.error("[inbound] Missing email_id or to addresses", data);
      return NextResponse.json(
        { error: "Missing email_id or to" },
        { status: 400 }
      );
    }

    // Find the relay+{threadId}@tellsafe.app address in the to list
    let threadId: string | null = null;
    for (const addr of toAddresses) {
      const match = addr.match(/relay\+([^@]+)@/);
      if (match) {
        threadId = match[1];
        break;
      }
    }

    if (!threadId) {
      console.log("[inbound] No relay address found in to:", toAddresses);
      return NextResponse.json({ status: "ignored", reason: "no_relay_address" });
    }

    console.log(`[inbound] Processing reply for thread ${threadId}`);

    // Fetch the full email body from Resend API
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const emailRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error(`[inbound] Failed to fetch email ${emailId}:`, errText);
      return NextResponse.json(
        { error: "Failed to fetch email from Resend" },
        { status: 500 }
      );
    }

    const emailData = await emailRes.json();
    const rawText: string = emailData?.text ?? "";
    const rawHtml: string = emailData?.html ?? "";

    // Clean the reply — strip quoted content
    const cleanText = stripEmailQuotes(rawText || htmlToPlainText(rawHtml));

    if (!cleanText.trim()) {
      console.log("[inbound] Empty reply after stripping quotes, ignoring.");
      return NextResponse.json({ status: "ignored", reason: "empty_reply" });
    }

    // Find the thread across all orgs
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
          console.log(`[inbound] Thread ${threadId} is closed, ignoring.`);
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

        // Update feedback status back to needs_reply so admins notice
        if (thread?.feedbackId) {
          await adminCollections
            .feedbackDoc(orgDoc.id, thread.feedbackId)
            .update({
              status: "needs_reply",
              updatedAt: new Date().toISOString(),
            });
        }

        console.log(
          `[inbound] Added member reply to thread ${threadId} in org ${orgDoc.id}`
        );
        found = true;
        break;
      }
    }

    if (!found) {
      console.error(`[inbound] Thread not found: ${threadId}`);
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[inbound] Webhook error:", error);
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
 * We want only the new content the member typed.
 */
function stripEmailQuotes(text: string): string {
  if (!text) return "";

  const lines = text.split("\n");
  const cleanLines: string[] = [];

  for (const line of lines) {
    if (
      line.match(/^On .+ wrote:$/i) ||
      line.match(/^>/) ||
      line.match(/^-{3,}/) ||
      line.match(/^_{3,}/) ||
      line.match(/^From:/i) ||
      line.match(/^Sent:/i) ||
      line.match(/^To:/i) ||
      line.match(/^Subject:/i)
    ) {
      break;
    }
    cleanLines.push(line);
  }

  return cleanLines.join("\n").trim();
}

/**
 * Simple HTML to plain text fallback.
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
