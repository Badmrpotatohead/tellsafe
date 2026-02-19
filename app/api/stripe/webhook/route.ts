// ============================================================
// TellSafe — Stripe Webhook Handler
// ============================================================
// POST: Receives Stripe webhook events to sync subscription state

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { getStripe, getPriceToPlan } from "../../../../lib/stripe";
import type Stripe from "stripe";

// Next.js App Router: disable body parsing for raw body access
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("[stripe/webhook] Missing stripe-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    // Verify webhook signature
    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("[stripe/webhook] Signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`[stripe/webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        const plan = session.metadata?.plan;

        if (!orgId || !plan) {
          console.error("[stripe/webhook] checkout.session.completed missing metadata");
          break;
        }

        await adminDb.collection("organizations").doc(orgId).update({
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          plan,
          updatedAt: new Date().toISOString(),
        });

        console.log(`[stripe/webhook] Org ${orgId} upgraded to ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;

        if (!orgId) {
          console.error("[stripe/webhook] subscription.updated missing orgId in metadata");
          break;
        }

        // Determine plan from the price ID
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? getPriceToPlan()[priceId] : null;

        if (plan) {
          await adminDb.collection("organizations").doc(orgId).update({
            plan,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[stripe/webhook] Org ${orgId} subscription updated to ${plan}`);
        }

        // Handle cancellation scheduled
        if (subscription.cancel_at_period_end) {
          console.log(`[stripe/webhook] Org ${orgId} subscription set to cancel at period end`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;

        if (!orgId) {
          console.error("[stripe/webhook] subscription.deleted missing orgId in metadata");
          break;
        }

        await adminDb.collection("organizations").doc(orgId).update({
          plan: "free",
          stripeSubscriptionId: null,
          updatedAt: new Date().toISOString(),
        });

        console.log(`[stripe/webhook] Org ${orgId} downgraded to free (subscription deleted)`);
        break;
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] Error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
