// ============================================================
// TellSafe — Stripe Webhook Handler
// ============================================================
// POST: Receives Stripe webhook events to sync subscription state
//
// Proration note: we do NOT pass proration_behavior anywhere here
// because this handler only reads events — it never calls
// stripe.subscriptions.update(). Proration on plan changes is
// handled by Stripe Checkout (default: create_prorations) and
// the Customer Portal (configured in your Stripe dashboard).
// Both default to create_prorations, so no extra code is needed.

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
        // interval is stored in metadata by the checkout route
        const interval = (session.metadata?.interval as "month" | "year") || "month";

        if (!orgId || !plan) {
          console.error("[stripe/webhook] checkout.session.completed missing metadata");
          break;
        }

        // Fetch the subscription to get trial_end (if any)
        let trialEndsAt: string | null = null;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          if (sub.trial_end) {
            trialEndsAt = new Date(sub.trial_end * 1000).toISOString();
          }
        }

        await adminDb.collection("organizations").doc(orgId).update({
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          plan,
          billingInterval: interval,
          trialEndsAt,
          updatedAt: new Date().toISOString(),
        });

        console.log(`[stripe/webhook] Org ${orgId} upgraded to ${plan} (${interval})${trialEndsAt ? ` — trial ends ${trialEndsAt}` : ""}`);
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
        const priceItem = subscription.items.data[0];
        const priceId = priceItem?.price?.id;
        const plan = priceId ? getPriceToPlan()[priceId] : null;

        // Derive interval from Stripe directly — covers portal-driven switches too
        const interval = (priceItem?.price?.recurring?.interval as "month" | "year") || "month";

        // Sync trial_end — null once they've paid or trial expired
        const trialEndsAt = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        if (plan) {
          await adminDb.collection("organizations").doc(orgId).update({
            plan,
            billingInterval: interval,
            trialEndsAt,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[stripe/webhook] Org ${orgId} subscription updated to ${plan} (${interval})`);
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

        // Downgrade to free — whether trial expired without payment or they cancelled
        await adminDb.collection("organizations").doc(orgId).update({
          plan: "free",
          billingInterval: null,
          stripeSubscriptionId: null,
          trialEndsAt: null,
          updatedAt: new Date().toISOString(),
        });

        console.log(`[stripe/webhook] Org ${orgId} downgraded to free (subscription deleted)`);
        break;
      }

      // Stripe fires this ~3 days before a trial ends (configurable in Stripe dashboard).
      // The actual downgrade happens via customer.subscription.deleted above.
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;
        console.log(`[stripe/webhook] Trial ending soon for org ${orgId}`);
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
