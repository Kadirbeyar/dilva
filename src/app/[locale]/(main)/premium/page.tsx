import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppSettings } from "@/lib/appSettings";
import PremiumPurchaseFlow from "@/components/premium/PremiumPurchaseFlow";
import ReferralCard from "@/components/premium/ReferralCard";
import VerifiedBadge from "@/components/profile/VerifiedBadge";

export default async function PremiumPage() {
  const t = await getTranslations("premium");
  const user = await getCurrentUser();
  if (!user) return null;

  // Sequential, not Promise.all — see admin/page.tsx's comment on the
  // same pattern (Supabase pooler has connection_limit=1).
  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const appSettings = await getAppSettings();
  const manualRequest = await prisma.manualPaymentRequest.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, plan: true, method: true, status: true },
  });
  const subscriptionActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
  // A referral bonus (see lib/referral.ts) also counts as "has
  // Premium" for hiding the pay form/pricing highlight, but it's
  // tracked separately from `subscription` — see lib/premium.ts's
  // isPremiumUser, which this mirrors.
  const bonusActive = Boolean(user.premiumBonusUntil && user.premiumBonusUntil.getTime() > Date.now());
  const isActive = subscriptionActive || bonusActive;
  const referralCount = await prisma.user.count({ where: { referredById: user.id } });

  return (
    <main className="relative mx-auto max-w-4xl px-4 py-10">
      <div className="bg-mesh" aria-hidden="true" />
      <h1 className="text-3xl font-bold text-gradient">{t("title")}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">{t("subtitle")}</p>

      <ul className="mt-6 grid gap-2.5 text-sm text-gray-700 dark:text-gray-200">
        <li className="flex items-center gap-2">
          <span className="text-brand-600">✓</span> {t("featureVisitors")}
        </li>
        <li className="flex items-center gap-2">
          <span className="text-brand-600">✓</span> {t("featureNearby")}
        </li>
        <li className="flex items-center gap-2">
          <span className="text-brand-600">✓</span> {t("featureAdvanced")}
        </li>
        <li className="flex items-center gap-2">
          <span className="text-brand-600">✓</span> {t("featureVerifiedBadge")}
        </li>
      </ul>

      {/* Live preview of the exact badge a Premium subscriber gets next
          to their name everywhere on Dilva (feed, chat, profile,
          matches, nav…) — see components/profile/VerifiedBadge.tsx. */}
      <div className="card-shadow mt-5 flex items-center gap-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 dark:border-brand-900/40 dark:from-brand-900/20 dark:to-gray-800">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            (user.displayName || user.username).slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900 dark:text-white">
            {user.displayName || user.username}
            <VerifiedBadge size="md" />
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">{t("verifiedBadgePreviewHint")}</p>
        </div>
      </div>

      {subscriptionActive && subscription?.currentPeriodEnd && (
        <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm dark:bg-brand-900/20">
          <p>
            {t("expiresOn", {
              date: subscription.currentPeriodEnd.toLocaleDateString(),
            })}
          </p>
        </div>
      )}

      {!subscriptionActive && bonusActive && user.premiumBonusUntil && (
        <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm dark:bg-brand-900/20">
          <p>{t("referralBonusActive", { date: user.premiumBonusUntil.toLocaleDateString() })}</p>
        </div>
      )}

      <div className="mt-8">
        <PremiumPurchaseFlow
          currentPlan={isActive ? subscription?.plan : null}
          isActive={subscriptionActive}
          bankInfo={appSettings.manualPaymentBankInfo}
          cryptoInfo={appSettings.manualPaymentCryptoInfo}
          fibInfo={appSettings.manualPaymentFibInfo}
          initialRequest={manualRequest}
        />
      </div>

      <ReferralCard username={user.username} referralCount={referralCount} />
    </main>
  );
}
