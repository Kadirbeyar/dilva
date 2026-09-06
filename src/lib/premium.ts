import { prisma } from "@/lib/prisma";
import type { Subscription } from "@prisma/client";

export class PremiumRequiredError extends Error {
  status = 402; // Payment Required
  constructor(message = "This feature requires Dilva Premium") {
    super(message);
  }
}

/** True if a subscription row represents currently-active Premium access. */
export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== "ACTIVE" && sub.status !== "TRIALING") return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < Date.now()) return false;
  return true;
}

/**
 * Checks whether `userId` currently has Premium access. Reads the
 * denormalized User.isPremiumCached flag first (fast path, kept in
 * sync by the Stripe webhook), falling back to a real Subscription
 * lookup so access is still correct even if the cache is stale.
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremiumCached: true },
  });
  if (user?.isPremiumCached) return true;

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return isSubscriptionActive(sub);
}

/** Throws PremiumRequiredError when the user is not Premium. Use at the top of gated Route Handlers. */
export async function requirePremium(userId: string): Promise<void> {
  const premium = await isPremiumUser(userId);
  if (!premium) {
    throw new PremiumRequiredError();
  }
}
