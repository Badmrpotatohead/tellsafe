// ============================================================
// TellSafe — Stripe Checkout Session API
// ============================================================
// POST: Create a Stripe Checkout Session for subscription upgrade

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminCollections } from "../../../../lib/firebase-admin";
import { getStripe, getPriceId, type BillingInterval } from "../../../../lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, plan, interval = "month" } = body as {
      orgId: string;
      plan: string;
      interval?: BillingInterval;
    };

    if (!orgId || !plan) {
      return NextResponse.json({ error: "orgId and plan required" }, { status: 400 });
    }

    if (plan !== "community" && plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (interval !== "month" && interval !== "year") {
      return NextResponse.json({ error: "Invalid interval — must be 'month' or 'year'" }, { status: 400 });
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

    // Get org data
    const orgDoc = await adminCollections.organization(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    const orgData = orgDoc.data()!;

    // Only give a trial if the org has never had a paid subscription before
    const hasHadTrial = !!orgData.trialEndsAt || !!orgData.stripeSubscriptionId;
    const trialDays = hasHadTrial ? undefined : 30;

    // Get or create Stripe customer
    const stripe = getStripe();
    let customerId = orgData.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: decoded.email || undefined,
        name: orgData.name,
        metadata: { orgId, firebaseUid: decoded.uid },
      });
      customerId = customer.id;

      // Save customer ID to org
      await adminCollections.organization(orgId).update({
        stripeCustomerId: customerId,
        updatedAt: new Date().toISOString(),
      });
    }

    // Resolve price ID for the requested plan + billing interval
    const priceId = getPriceId(plan, interval);
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${plan} / ${interval}` },
        { status: 500 }
      );
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/admin?billing=success`,
      cancel_url: `${appUrl}/admin?billing=cancel`,
      // Pass plan + interval through so the webhook can persist both
      metadata: { orgId, plan, interval },
      subscription_data: {
        metadata: { orgId, plan, interval },
        // 30-day free trial for first-time subscribers only
        ...(trialDays ? { trial_period_days: trialDays } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
