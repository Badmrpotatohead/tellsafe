// ============================================================
// TellSafe — Stripe SDK (Server-Side Only)
// ============================================================
// Used in: Next.js API routes (server-side)
// NEVER import this in client-side code
// Uses lazy init so build succeeds without STRIPE_SECRET_KEY

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("[stripe] STRIPE_SECRET_KEY is not set — billing features are unavailable");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Map Stripe Price IDs to TellSafe plan names
export function getPriceToPlan(): Record<string, "community" | "pro"> {
  return {
    [process.env.STRIPE_PRICE_COMMUNITY || ""]: "community",
    [process.env.STRIPE_PRICE_PRO || ""]: "pro",
  };
}

export function getPlanToPrice(): Record<string, string> {
  return {
    community: process.env.STRIPE_PRICE_COMMUNITY || "",
    pro: process.env.STRIPE_PRICE_PRO || "",
  };
}
