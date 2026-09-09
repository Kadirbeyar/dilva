import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppSettings } from "@/lib/appSettings";
import PricingTable from "@/components/premium/PricingTable";
import ManualPaymentForm from "@/components/premium/ManualPaymentForm";

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
  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

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

      {isActive && subscription?.currentPeriodEnd && (
        <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm dark:bg-brand-900/20">
          <p>
            {t("expiresOn", {
              date: subscription.currentPeriodEnd.toLocaleDateString(),
            })}
          </p>
        </div>
      )}

      <div className="mt-8">
        <PricingTable currentPlan={isActive ? subscription?.plan : null} />
      </div>

      {!isActive && (
        <ManualPaymentForm
          bankInfo={appSettings.manualPaymentBankInfo}
          cryptoInfo={appSettings.manualPaymentCryptoInfo}
          initialRequest={manualRequest}
        />
      )}
    </main>
  );
}
