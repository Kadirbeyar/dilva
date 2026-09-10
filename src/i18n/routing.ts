import { defineRouting } from "next-intl/routing";

/**
 * Dilva UI locales.
 *
 * "ku"  — Kurdish, Badini dialect, written in the Arabic-based Kurdish
 *          script (سۆرانی script family). This is a right-to-left (RTL)
 *          locale — see LOCALE_DIRECTION below and app/[locale]/layout.tsx,
 *          which sets <html dir="rtl"> whenever this locale is active.
 * "ckb" — Kurdish, Sorani dialect, Arabic-based script. Also RTL.
 * "ar"  — Arabic. Also RTL.
 * "tr"  — Turkish
 * "en"  — English
 *
 * NOTE: these are UI/interface locales (next-intl), separate from the
 * `Language` table in prisma/schema.prisma, which lists every language
 * a user can set as nativeLanguage/targetLanguage for the matching
 * engine (Kurdish Badini there uses the fuller code "kmr-badini").
 */
export const routing = defineRouting({
  locales: ["ku", "ckb", "ar", "tr", "en"],
  defaultLocale: "ku",
  localePrefix: "always", // /ku/..., /ckb/..., /ar/..., /tr/..., /en/...
  localeCookie: {
    name: "DILVA_LOCALE",
  },
});

export type AppLocale = (typeof routing.locales)[number];

export const LOCALE_DIRECTION: Record<AppLocale, "rtl" | "ltr"> = {
  ku: "rtl",
  ckb: "rtl",
  ar: "rtl",
  tr: "ltr",
  en: "ltr",
};

export const LOCALE_LABELS: Record<AppLocale, string> = {
  ku: "کوردی (بادینی)",
  ckb: "کوردی (سۆرانی)",
  ar: "العربية",
  tr: "Türkçe",
  en: "English",
};
