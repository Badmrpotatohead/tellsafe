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
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const { adminDb, adminCollections } = await import(
      "../../../../lib/firebase-admin"
    );
    const { FieldValue } = await import("firebase-admin/firestore");

    // Resend sends JSON
    const body = await request.json();

    console.log("[inbound] Received webhook type:", body?.type);
    console.log("[inbound] Full payload:", JSON.stringify(body?.data));

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

    // Fetch the full email body via Resend SDK
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const resend = new Resend(apiKey);
    const { data: emailData, error: resendError } = await resend.emails.receiving.get(emailId);

    if (resendError || !emailData) {
      console.error(`[inbound] Failed to fetch email ${emailId}:`, JSON.stringify(resendError));
      return NextResponse.json(
        { error: "Failed to fetch email from Resend", detail: resendError },
        { status: 500 }
      );
    }

    const rawText: string = (emailData as any)?.text ?? "";
    const rawHtml: string = (emailData as any)?.html ?? "";

    console.log(`[inbound] rawText (first 500 chars): ${rawText.slice(0, 500)}`);
    console.log(`[inbound] rawHtml length: ${rawHtml.length}`);

    // Clean the reply — strip quoted content
    const sourceText = rawText || htmlToPlainText(rawHtml);
    const cleanText = stripEmailQuotes(sourceText);

    console.log(`[inbound] cleanText (first 300 chars): ${cleanText.slice(0, 300)}`);

    if (!cleanText.trim()) {
      console.log("[inbound] Empty reply after stripping quotes — sourceText was:", sourceText.slice(0, 200));
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
 *
 * Strategy:
 * 1. Skip any leading RFC-style headers (To:/From:/Subject:) that appear before
 *    a blank line — these are raw email headers, not the message body.
 * 2. Then scan for quote markers and stop at the first one found.
 */
function stripEmailQuotes(text: string): string {
  if (!text) return "";

  const lines = text.split("\n");
  let startIndex = 0;

  // Step 1: If the text starts with RFC email headers (To:/From:/Subject:/Date:
  // at the very top before a blank line), skip past them.
  const headerPattern = /^(To|From|Subject|Date|Cc|Bcc|Message-ID|Content-Type|MIME-Version|Delivered-To|Reply-To):/i;
  let inHeaderBlock = true;
  for (let i = 0; i < lines.length; i++) {
    if (inHeaderBlock) {
      if (lines[i].trim() === "") {
        // Blank line ends the header block — message body starts after this
        startIndex = i + 1;
        break;
      } else if (!headerPattern.test(lines[i]) && !lines[i].match(/^\s+/)) {
        // Non-header line before a blank line — not a header block, start from 0
        inHeaderBlock = false;
        startIndex = 0;
        break;
      }
    }
  }

  // Step 2: Collect lines until we hit a quote marker
  const cleanLines: string[] = [];
  let seenContent = false; // track if we've seen non-empty content yet

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Quote markers — stop here
    if (
      // "On Mon, Jan 1, 2024, Person <email> wrote:" (may span multiple lines)
      // Match start of the pattern: "On " followed by date-like content
      trimmed.match(/^On .{5,}wrote:$/i) ||
      trimmed.match(/^On .{5,}wrote:\s*$/i) ||
      // Outlook-style "From: Person" after content
      (seenContent && trimmed.match(/^From:/i)) ||
      (seenContent && trimmed.match(/^Sent:/i)) ||
      (seenContent && trimmed.match(/^To:/i)) ||
      (seenContent && trimmed.match(/^Subject:/i)) ||
      // Quoted text ("> text")
      trimmed.match(/^>/) ||
      // Horizontal rules used by email clients
      trimmed.match(/^-{3,}/) ||
      trimmed.match(/^_{3,}/) ||
      // Gmail-style "---------- Forwarded message ---------"
      trimmed.match(/^-{5,}\s*(Forwarded|Original)/i)
    ) {
      break;
    }

    if (trimmed !== "") seenContent = true;
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
