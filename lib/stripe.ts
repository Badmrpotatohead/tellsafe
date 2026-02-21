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

// ---------------------------------------------------------------------------
// Price ID → plan name
// Covers all four price IDs: monthly + annual for community + pro
// ---------------------------------------------------------------------------
export function getPriceToPlan(): Record<string, "community" | "pro"> {
  return {
    [process.env.STRIPE_PRICE_COMMUNITY          || ""]: "community",
    [process.env.STRIPE_PRICE_COMMUNITY_ANNUAL   || ""]: "community",
    [process.env.STRIPE_PRICE_PRO                || ""]: "pro",
    [process.env.STRIPE_PRICE_PRO_ANNUAL         || ""]: "pro",
  };
}

// ---------------------------------------------------------------------------
// Plan + billing interval → price ID
// ---------------------------------------------------------------------------
export type BillingInterval = "month" | "year";

export function getPriceId(
  plan: "community" | "pro",
  interval: BillingInterval
): string {
  const map: Record<string, string> = {
    "community:month": process.env.STRIPE_PRICE_COMMUNITY        || "",
    "community:year":  process.env.STRIPE_PRICE_COMMUNITY_ANNUAL || "",
    "pro:month":       process.env.STRIPE_PRICE_PRO              || "",
    "pro:year":        process.env.STRIPE_PRICE_PRO_ANNUAL       || "",
  };
  return map[`${plan}:${interval}`] || "";
}

// Legacy helper — kept for any callers that don't need interval awareness
export function getPlanToPrice(): Record<string, string> {
  return {
    community: process.env.STRIPE_PRICE_COMMUNITY || "",
    pro:       process.env.STRIPE_PRICE_PRO       || "",
  };
}
