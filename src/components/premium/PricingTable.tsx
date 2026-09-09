"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { PLAN_CATALOGUE, pricePerMonth } from "@/lib/plans";
import type { SubscriptionPlan } from "@prisma/client";

const PLAN_ORDER: SubscriptionPlan[] = ["MONTH_1", "MONTH_3", "MONTH_6", "MONTH_12"];

/**
 * Pure pricing display. Clicking a plan's button just reports the pick
 * upward via onSelectPlan — see PremiumPurchaseFlow, which decides
 * what happens next (opens the bank/FIB/crypto modal for most Dilva
 * users, since Stripe cards mostly don't work from Iraq; falls back
 * to /api/checkout directly only if no manual method is configured,
 * or the user already has an active Stripe subscription).
 */
export default function PricingTable({
  currentPlan,
  onSelectPlan,
}: {
  currentPlan?: SubscriptionPlan | null;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}) {
  const t = useTranslations("premium");

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PLAN_ORDER.map((plan, i) => {
        const { priceUsd, labelKey } = PLAN_CATALOGUE[plan];
        const isCurrent = currentPlan === plan;
        const isBestValue = plan === "MONTH_12";

        return (
          <motion.div
            key={plan}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className={`relative flex flex-col gap-2 rounded-2xl bg-white p-6 transition-shadow dark:bg-gray-800 ${
              isBestValue ? "card-shadow-lift ring-2 ring-brand-500" : "card-shadow"
            }`}
          >
            {isBestValue && (
              <span className="absolute -top-3 start-5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow">
                ★ Best value
              </span>
            )}
            <p className="text-sm font-medium text-gray-500">{t(labelKey as any)}</p>
            <p className="text-3xl font-bold">
              ${priceUsd}
              <span className="text-base font-normal text-gray-500">
                {" "}
                / {PLAN_CATALOGUE[plan].months}mo
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {t("perMonth", { price: pricePerMonth(plan) })}
            </p>
            <motion.button
              whileHover={{ scale: isCurrent ? 1 : 1.03 }}
              whileTap={{ scale: isCurrent ? 1 : 0.97 }}
              onClick={() => onSelectPlan(plan)}
              disabled={isCurrent}
              className="mt-3 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {isCurrent ? t("currentPlan") : t("subscribe")}
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
}
