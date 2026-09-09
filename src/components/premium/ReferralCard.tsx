"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { REFERRAL_BONUS_DAYS } from "@/lib/referral";

/**
 * Shown at the bottom of /premium: every user (Premium or not) has a
 * referral link, since the whole point is to pull in NEW signups, not
 * reward people who are already paying. See lib/referral.ts for how
 * the bonus itself is granted (at the referred person's onboarding).
 */
export default function ReferralCard({
  username,
  referralCount,
}: {
  username: string;
  referralCount: number;
}) {
  const t = useTranslations("premium");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/signup?ref=${encodeURIComponent(username)}`
      : `/${locale}/signup?ref=${encodeURIComponent(username)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (very old browsers, some
      // embedded webviews) — the link is still selectable as plain
      // text below, so this just skips the one-tap convenience.
    }
  }

  return (
    <div className="card-shadow mt-8 rounded-2xl bg-white p-6 dark:bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("referralTitle")}</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {t("referralSubtitle", { days: REFERRAL_BONUS_DAYS })}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
        />
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          {copied ? t("referralCopied") : t("referralCopy")}
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {t("referralCount", { count: referralCount })}
      </p>
    </div>
  );
}
