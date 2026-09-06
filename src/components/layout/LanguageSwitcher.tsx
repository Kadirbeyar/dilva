"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, LOCALE_LABELS, type AppLocale } from "@/i18n/routing";

/**
 * Dropdown to switch between ku / tr / en. Preserves the current
 * page — only the locale segment of the URL changes.
 */
export default function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function onChange(nextLocale: AppLocale) {
    router.replace(
      // @ts-expect-error -- params shape is dynamic per-route
      { pathname, params },
      { locale: nextLocale }
    );
  }

  return (
    <select
      aria-label="Language / زمان / Dil"
      value={locale}
      onChange={(e) => onChange(e.target.value as AppLocale)}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
