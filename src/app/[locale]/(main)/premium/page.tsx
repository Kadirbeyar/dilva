import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppSettings } from "@/lib/appSettings";
import PremiumPurchaseFlow from "@/components/premium/PremiumPurchaseFlow";
import ReferralCard from "@/components/premium/ReferralCard";

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
      </ul>

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
