/**
 * The floating radio button's four fixed stations — see
 * components/layout/RadioPlayerButton.tsx (the picker shown to every
 * user) and components/admin/RadioSettingsForm.tsx (where an admin
 * sets each station's stream URL). Flag + native name, not run
 * through next-intl: a language's own name in its own script doesn't
 * change with the viewer's UI locale, same reasoning as the language
 * chips this app already shows elsewhere (e.g. the old landing page's
 * LANGUAGE_CHIPS).
 */
export const RADIO_STATIONS = [
  { code: "ku", flag: "🟡", name: "کوردی" },
  { code: "tr", flag: "🇹🇷", name: "Türkçe" },
  { code: "ar", flag: "🇸🇦", name: "العربية" },
  { code: "en", flag: "🇬🇧", name: "English" },
] as const;

export type RadioStationCode = (typeof RADIO_STATIONS)[number]["code"];
