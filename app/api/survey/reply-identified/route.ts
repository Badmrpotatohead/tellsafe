// ============================================================
// TellSafe — Survey Identified Respondent Reply API
// ============================================================
// POST: Send a direct email to an identified survey respondent.
// The email comes from TellSafe on behalf of the org, with
// Reply-To set to the admin's email so the respondent can reply.
//
// Auth: Bearer token (admin must be a member of the org)
// Body: { orgId, surveyId, responseId, message }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

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

    const { orgId, surveyId, responseId, message } = await request.json();

    if (!orgId || !surveyId || !responseId || !message?.trim()) {
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

    // ── Load the survey response ───────────────────────────────
    const responseSnap = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("surveys")
      .doc(surveyId)
      .collection("responses")
      .doc(responseId)
      .get();

    if (!responseSnap.exists) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    const responseData = responseSnap.data()!;

    if (responseData.responseType !== "identified") {
      return NextResponse.json(
        { error: "This response is not identified — cannot send direct email" },
        { status: 400 }
      );
    }

    const respondentEmail = responseData.respondentEmail as string | null;
    const respondentName = responseData.respondentName as string | null;

    if (!respondentEmail?.trim()) {
      return NextResponse.json(
        { error: "No email address on this response" },
        { status: 400 }
      );
    }

    // ── Load org info ──────────────────────────────────────────
    const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
    const orgData = orgSnap.data();
    const orgName = orgData?.name || "Your organization";

    // ── Load survey title ──────────────────────────────────────
    const surveySnap = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("surveys")
      .doc(surveyId)
      .get();

    const surveyTitle = surveySnap.exists ? (surveySnap.data()?.title as string) : "Survey";

    // ── Admin's email (for Reply-To) ───────────────────────────
    const adminEmail = decoded.email || `noreply@tellsafe.app`;

    // ── Send via Resend ────────────────────────────────────────
    const greeting = respondentName ? `Hi ${respondentName},` : "Hi,";

    await getResend().emails.send({
      from: `${orgName} via TellSafe <noreply@tellsafe.app>`,
      to: respondentEmail.trim(),
      replyTo: adminEmail,
      subject: `Re: ${surveyTitle} — ${orgName}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
          <div style="background: #f8f6f1; border-radius: 16px; padding: 32px; border: 1px solid #e8e5de;">

            <p style="font-size: 15px; color: #1a1a2e; margin: 0 0 4px; font-weight: 600;">
              ${greeting}
            </p>
            <p style="font-size: 13px; color: #8a8578; margin: 0 0 20px;">
              A message from <strong>${orgName}</strong> regarding your survey response:
            </p>

            <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e8e5de; margin-bottom: 20px;">
              <p style="font-size: 15px; color: #1a1a2e; line-height: 1.65; margin: 0; white-space: pre-wrap;">${message.trim()}</p>
            </div>

            <p style="font-size: 13px; color: #5a5650; line-height: 1.5; margin: 0;">
              You can reply directly to this email to continue the conversation.
            </p>
          </div>

          <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">
            You're receiving this because you submitted identified feedback to
            <strong>${orgName}</strong> via
            <a href="https://tellsafe.app" style="color: #2d6a6a;">TellSafe</a>.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Survey reply-identified error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
