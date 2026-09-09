import { prisma } from "@/lib/prisma";

/** Days of free Premium granted to EACH side of a successful referral. */
export const REFERRAL_BONUS_DAYS = 7;

/**
 * Extends `premiumBonusUntil` by REFERRAL_BONUS_DAYS, stacking on top
 * of whatever bonus time (or none) the user already had rather than
 * always resetting to "N days from now" — so referring several people
 * in the same week actually adds up instead of the later ones being
 * wasted.
 */
export async function grantReferralBonusDays(userId: string, days = REFERRAL_BONUS_DAYS): Promise<Date> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { premiumBonusUntil: true } });
  const base = user?.premiumBonusUntil && user.premiumBonusUntil.getTime() > Date.now()
    ? user.premiumBonusUntil
    : new Date();
  const until = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.user.update({ where: { id: userId }, data: { premiumBonusUntil: until } });
  return until;
}

/**
 * Links a brand-new account to whoever referred them (by username,
 * from a ?ref= link — see the signup/onboarding pages) and grants both
 * sides their bonus days. Called once, from /api/profile/complete, and
 * only for a genuine first-time onboarding — see that route for the
 * guard. Silently does nothing for a missing/unknown/self-referral
 * code, since a referral link is a nice-to-have, never something that
 * should be able to block or error out account creation.
 */
export async function applyReferralIfEligible(newUserId: string, referralUsername: string): Promise<void> {
  const referrer = await prisma.user.findUnique({
    where: { username: referralUsername },
    select: { id: true },
  });
  if (!referrer || referrer.id === newUserId) return;

  await prisma.user.update({ where: { id: newUserId }, data: { referredById: referrer.id } });

  const referrerUntil = await grantReferralBonusDays(referrer.id);
  const refereeUntil = await grantReferralBonusDays(newUserId);

  // Sequential, not Promise.all — see the connection_limit=1 note that
  // shows up throughout this codebase (e.g. lib/geo.ts, lib/auth.ts).
  await prisma.notification.create({
    data: {
      userId: referrer.id,
      type: "REFERRAL_BONUS_EARNED",
      data: { role: "referrer", days: REFERRAL_BONUS_DAYS, until: referrerUntil.toISOString() },
    },
  });
  await prisma.notification.create({
    data: {
      userId: newUserId,
      type: "REFERRAL_BONUS_EARNED",
      data: { role: "referee", days: REFERRAL_BONUS_DAYS, until: refereeUntil.toISOString() },
    },
  });
}
