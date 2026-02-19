// ============================================================
// TellSafe — Stripe Customer Portal API
// ============================================================
// POST: Create a Stripe Customer Portal session for billing management

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminCollections } from "../../../../lib/firebase-admin";
import { getStripe } from "../../../../lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    // Verify admin
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const adminDoc = await adminCollections.admins(orgId).doc(decoded.uid).get();
    if (!adminDoc.exists) {
      return NextResponse.json({ error: "Not an admin" }, { status: 403 });
    }

    // Get org's Stripe customer ID
    const orgDoc = await adminCollections.organization(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const customerId = orgDoc.data()?.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json(
        { error: "No billing account found. Please upgrade first." },
        { status: 400 }
      );
    }

    // Create portal session
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/admin?billing=portal`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
