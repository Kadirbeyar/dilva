"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, LOCALE_LABELS, type AppLocale } from "@/i18n/routing";

const LANG_CHOSEN_KEY = "dilva_lang_chosen";
// How long the plain logo shows before either fading straight into the
// app (returning visitor) or handing off to the language picker
// (first-ever visit) — matches the original splash-only duration so
// returning visitors see no change at all.
const LOGO_DURATION = 2200;
// Small grace period after the visitor taps a language, before the
// overlay disappears — router.replace()'s locale switch is a real
// navigation (new server render), so removing the overlay instantly
// would flash the auto-detected language underneath for a moment.
const NAVIGATE_GRACE = 450;

/**
 * Two-part intro overlay mounted once in the root layout (not a
 * per-page component) so it appears on a cold load/app-open (e.g. from
 * the iPhone Home Screen icon) but never again on normal in-app
 * navigation, since Next.js doesn't remount the root layout for those.
 *
 * 1. Logo phase — just the Dilva wordmark, always shown briefly.
 * 2. Picker phase — ONLY the very first time this browser opens the
 *    app (tracked via localStorage, same convention as the dark-mode
 *    flag in app/[locale]/layout.tsx): lets the visitor pick their own
 *    UI language instead of relying on next-intl's Accept-Language
 *    auto-detect, which is often wrong for Dilva's audience.
 */
export default function SplashScreen() {
  const [phase, setPhase] = useState<"logo" | "picker" | "done">("logo");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      let alreadyChosen = true;
      try {
        alreadyChosen = localStorage.getItem(LANG_CHOSEN_KEY) === "1";
      } catch {
        // localStorage unavailable (private mode, etc.) — fail open
        // rather than forcing the picker on every single load.
      }
      setPhase(alreadyChosen ? "done" : "picker");
    }, LOGO_DURATION);
    return () => clearTimeout(timer);
  }, []);

  function choose(locale: AppLocale) {
    try {
      localStorage.setItem(LANG_CHOSEN_KEY, "1");
    } catch {
      // Ignore — worst case the picker shows again next time.
    }
    router.replace(
      // @ts-expect-error -- params shape is dynamic per-route
      { pathname, params },
      { locale }
    );
    setTimeout(() => setPhase("done"), NAVIGATE_GRACE);
  }

  return (
    <AnimatePresence mode="wait">
      {phase === "logo" && (
        <motion.div
          key="logo"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: "#0c0c13" }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-gradient text-5xl font-extrabold tracking-tight sm:text-6xl"
          >
            Dilva
          </motion.span>
        </motion.div>
      )}

      {phase === "picker" && (
        <motion.div
          key="picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-8 px-6"
          style={{ background: "#0c0c13" }}
        >
          <span className="text-gradient text-3xl font-extrabold tracking-tight sm:text-4xl">
            Dilva
          </span>
          <p className="text-center text-sm leading-relaxed text-gray-400">
            زمانێ خۆ هەلبژێرە
            <br />
            Dilinizi seçin
            <br />
            Choose your language
          </p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            {routing.locales.map((l) => (
              <motion.button
                key={l}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => choose(l)}
                className="rounded-full border border-gray-700 bg-white/5 px-5 py-3 text-base font-medium text-white transition hover:border-brand-500 hover:bg-white/10"
              >
                {LOCALE_LABELS[l]}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
