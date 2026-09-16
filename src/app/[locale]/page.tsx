"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { captureReferralFromUrl } from "@/lib/referralCapture";

// How long the splash stays up before auto-advancing to the
// login/signup welcome screen — long enough to read as an
// intentional brand moment (like WhatsApp/Instagram's own splash),
// short enough that nobody's kept waiting.
const SPLASH_DURATION_MS = 3000;

export default function LandingPage() {
  const t = useTranslations("landing");
  const [showSplash, setShowSplash] = useState(true);

  // Remembers a ?ref=<username> link (see lib/referralCapture.ts) so a
  // signup later in this session — even after the splash and on to
  // the welcome screen — still credits whoever shared the link.
  useEffect(() => {
    captureReferralFromUrl();
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  const highlights = [1, 2, 3, 4].map((n) => ({
    title: t(`feature${n}Title` as any),
    icon: ["🤝", "✍️", "💬", "📍"][n - 1],
  }));

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="bg-mesh" aria-hidden="true" />

      <AnimatePresence mode="wait">
        {showSplash ? (
          // A brief, logo-first splash — no nav, no scrolling, nothing
          // to interact with — exactly like opening a mobile app
          // rather than landing on a marketing page. Auto-advances via
          // the timer above; the progress bar just makes that visible
          // rather than leaving a static logo up with no feedback.
          <motion.div
            key="splash"
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex min-h-dvh flex-col items-center justify-center px-6"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl font-extrabold tracking-tight text-gradient"
            >
              Dilva
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {t("heroKicker")}
            </motion.span>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-10 h-1.5 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: SPLASH_DURATION_MS / 1000, ease: "linear" }}
                className="h-full w-full rounded-full bg-brand-600"
              />
            </motion.div>
          </motion.div>
        ) : (
          // The real "front door": a compact, animated welcome card —
          // brand + a one-line pitch + a quick 4-tile highlight strip
          // (reusing the landing feature copy, just without the long
          // marketing scroll that used to follow it) — then straight
          // to Login/Signup, mirroring the (auth) pages' own card
          // style so the transition from here into either form feels
          // like one continuous screen rather than a different site.
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto flex min-h-dvh max-w-sm flex-col px-6 py-8"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold tracking-tight text-gradient">Dilva</span>
              <LanguageSwitcher />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card-shadow-lift w-full rounded-3xl bg-white p-7 text-center dark:bg-gray-800"
              >
                <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">
                  {t("heroTitle")}
                </h1>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t("heroSubtitle")}</p>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  {highlights.map((h, i) => (
                    <motion.div
                      key={h.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                      className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2.5 text-start text-xs font-medium text-gray-700 dark:bg-gray-900/60 dark:text-gray-200"
                    >
                      <span className="text-base">{h.icon}</span>
                      <span className="truncate">{h.title}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                  className="mt-7 flex flex-col gap-3"
                >
                  <Link
                    href="/signup"
                    className="rounded-full bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl"
                  >
                    {t("heroCtaPrimary")}
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-gray-300 px-6 py-3.5 font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-black/5 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/10"
                  >
                    {t("heroCtaSecondary")}
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            <footer className="text-center text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center gap-4">
                <Link href="/terms" className="underline transition hover:text-gray-700 dark:hover:text-gray-200">
                  {t("footerTerms")}
                </Link>
                <Link href="/privacy" className="underline transition hover:text-gray-700 dark:hover:text-gray-200">
                  {t("footerPrivacy")}
                </Link>
              </div>
              <p className="mt-2">© {new Date().getFullYear()} Dilva</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
