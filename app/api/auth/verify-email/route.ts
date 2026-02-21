// ============================================================
// TellSafe — Custom Email Verification API
// ============================================================
// POST: Generate a Firebase verification link and send it via
//       Resend so it lands in the inbox rather than spam.
//
// Body: { email: string }
// Auth: Bearer token (must belong to the email being verified)
// ============================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../lib/firebase-admin";
import { sendVerificationEmail } from "../../../../lib/email";

export async function POST(request: NextRequest) {
  try {
    // --- Auth ---
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token || token === "undefined" || token === "null") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Body ---
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Only allow sending a verification email to the authenticated user's own email
    if (decoded.email !== email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Generate link via Admin SDK (no email sent by Firebase) ---
    const verificationLink = await adminAuth.generateEmailVerificationLink(email);

    // --- Send branded email via Resend ---
    await sendVerificationEmail({ toEmail: email, verificationLink });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("verify-email route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
