"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * Lets an admin edit the bank/Qi Card + crypto instructions shown to
 * everyone on /premium for manual (non-Stripe) Premium payments — see
 * lib/appSettings.ts. Free text so it can include a name, IBAN/Qi Card
 * number, and a note about which transfer type to use, without a
 * code change every time an account detail changes.
 */
export default function ManualPaymentSettingsForm({
  initialBankInfo,
  initialCryptoInfo,
  initialFibInfo,
}: {
  initialBankInfo: string | null;
  initialCryptoInfo: string | null;
  initialFibInfo: string | null;
}) {
  const t = useTranslations("admin");
  const [bankInfo, setBankInfo] = useState(initialBankInfo ?? "");
  const [cryptoInfo, setCryptoInfo] = useState(initialCryptoInfo ?? "");
  const [fibInfo, setFibInfo] = useState(initialFibInfo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(false);
    const res = await fetch("/api/settings/manual-payment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manualPaymentBankInfo: bankInfo,
        manualPaymentCryptoInfo: cryptoInfo,
        manualPaymentFibInfo: fibInfo,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
    } else {
      setError(true);
    }
  }

  return (
    <div className="card-shadow rounded-2xl bg-white p-5 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
        {t("manualPaymentSettingsTitle")}
      </h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {t("manualPaymentSettingsSubtitle")}
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("manualPaymentBankLabel")}
          </span>
          <textarea
            value={bankInfo}
            onChange={(e) => setBankInfo(e.target.value)}
            rows={3}
            placeholder={t("manualPaymentBankPlaceholder")}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("manualPaymentFibLabel")}
          </span>
          <textarea
            value={fibInfo}
            onChange={(e) => setFibInfo(e.target.value)}
            rows={3}
            placeholder={t("manualPaymentFibPlaceholder")}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("manualPaymentCryptoLabel")}
          </span>
          <textarea
            value={cryptoInfo}
            onChange={(e) => setCryptoInfo(e.target.value)}
            rows={3}
            placeholder={t("manualPaymentCryptoPlaceholder")}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving}
            className="self-start rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("radioSaveButton")}
          </motion.button>
          {saved && <span className="text-sm text-green-600">✓</span>}
          {error && <span className="text-sm text-red-600">✕</span>}
        </div>
      </div>
    </div>
  );
}
