import type { SubscriptionPlan } from "@prisma/client";

/**
 * Canonical Dilva Premium plan catalogue. This is the single source
 * of truth for pricing shown in the UI (components/premium/PricingTable.tsx)
 * and for what gets charged via Stripe (app/api/checkout/route.ts).
 *
 * Each plan maps to a Stripe Price ID configured via env vars — create
 * these once in the Stripe Dashboard (Product: "Dilva Premium", one
 * recurring Price per duration) and paste the IDs into .env.
 */
export const PLAN_CATALOGUE: Record<
  SubscriptionPlan,
  { months: number; priceUsd: number; stripePriceEnvVar: string; labelKey: string }
> = {
  MONTH_1: {
    months: 1,
    priceUsd: 10,
    stripePriceEnvVar: "STRIPE_PRICE_1_MONTH",
    labelKey: "planLabel1",
  },
  MONTH_3: {
    months: 3,
    priceUsd: 25,
    stripePriceEnvVar: "STRIPE_PRICE_3_MONTHS",
    labelKey: "planLabel3",
  },
  MONTH_6: {
    months: 6,
    priceUsd: 42,
    stripePriceEnvVar: "STRIPE_PRICE_6_MONTHS",
    labelKey: "planLabel6",
  },
  MONTH_12: {
    months: 12,
    priceUsd: 80,
    stripePriceEnvVar: "STRIPE_PRICE_12_MONTHS",
    labelKey: "planLabel12",
  },
};

export function getStripePriceId(plan: SubscriptionPlan): string {
  const envVar = PLAN_CATALOGUE[plan].stripePriceEnvVar;
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Missing env var ${envVar} for plan ${plan}`);
  }
  return value;
}

export function pricePerMonth(plan: SubscriptionPlan): number {
  const { priceUsd, months } = PLAN_CATALOGUE[plan];
  return Math.round((priceUsd / months) * 100) / 100;
}

export function isValidPlan(value: string): value is SubscriptionPlan {
  return value in PLAN_CATALOGUE;
}
