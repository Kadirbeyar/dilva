"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { captureReferralFromUrl } from "@/lib/referralCapture";

const LANGUAGE_CHIPS = [
  { label: "کوردی", flag: "🟡" },
  { label: "Türkçe", flag: "🇹🇷" },
  { label: "English", flag: "🇬🇧" },
  { label: "العربية", flag: "🇸🇦" },
  { label: "Español", flag: "🇪🇸" },
  { label: "Français", flag: "🇫🇷" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function LandingPage() {
  const t = useTranslations("landing");
  const tAuth = useTranslations("auth");

  // Remembers a ?ref=<username> link (see lib/referralCapture.ts) so a
  // signup later in this session — even after clicking around the
  // site first — still credits whoever shared the link.
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  const features = [1, 2, 3, 4].map((n) => ({
    title: t(`feature${n}Title` as any),
    desc: t(`feature${n}Desc` as any),
    icon: ["🤝", "✍️", "💬", "📍"][n - 1],
  }));

  const steps = [1, 2, 3].map((n) => ({
    title: t(`step${n}Title` as any),
    desc: t(`step${n}Desc` as any),
  }));

  return (
    <main className="relative overflow-hidden">
      <div className="bg-mesh" aria-hidden="true" />

      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-2xl font-extrabold tracking-tight text-gradient">Dilva</span>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
          >
            {t("navLogin")}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md"
          >
            {t("navSignup")}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-8 lg:grid-cols-2 lg:pb-32">
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
          <motion.span
            variants={fadeUp}
            custom={0}
            className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
          >
            {t("heroKicker")}
          </motion.span>
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
          >
            {t("heroTitle")}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-5 max-w-lg text-lg text-gray-600 dark:text-gray-300"
          >
            {t("heroSubtitle")}
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-brand-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl"
            >
              {t("heroCtaPrimary")}
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-gray-300 px-7 py-3.5 font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-black/5 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/10"
            >
              {t("heroCtaSecondary")}
            </Link>
          </motion.div>
        </motion.div>

        {/* Animated visual: floating language chips around a mock chat card */}
        <div className="relative mx-auto h-[420px] w-full max-w-md">
          {LANGUAGE_CHIPS.map((chip, i) => {
            const positions = [
              "start-2 top-2",
              "end-4 top-8",
              "start-0 top-1/2",
              "end-0 top-1/2",
              "start-8 bottom-4",
              "end-6 bottom-0",
            ];
            return (
              <motion.div
                key={chip.label}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className={`absolute z-10 ${positions[i]} ${
                  i % 2 === 0 ? "animate-float-slow" : "animate-float-slower"
                } card-shadow rounded-full bg-white px-3.5 py-2 text-sm font-semibold dark:bg-gray-800`}
              >
                <span className="me-1.5">{chip.flag}</span>
                {chip.label}
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="card-shadow-lift absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 dark:bg-gray-800"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t("mockChatTitle")}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <div className="max-w-[85%] self-start rounded-2xl rounded-ss-sm bg-gray-100 px-3.5 py-2.5 text-sm dark:bg-gray-700">
                {t("mockMessage1")}
              </div>
              <div className="max-w-[85%] self-end rounded-2xl rounded-se-sm bg-brand-600 px-3.5 py-2.5 text-sm text-white">
                {t("mockMessage2")}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            {t("howItWorksKicker")}
          </span>
          <h2 className="mt-2 text-3xl font-bold">{t("howItWorksTitle")}</h2>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative rounded-2xl border border-gray-200 p-6 dark:border-gray-700"
            >
              <span className="text-gradient text-4xl font-extrabold">{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            {t("featuresKicker")}
          </span>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="card-shadow rounded-2xl bg-white p-6 transition dark:bg-gray-800"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-orange-500 px-8 py-14 text-center text-white"
        >
          <h2 className="text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-3 text-white/90">{t("ctaSubtitle")}</p>
          <Link
            href="/signup"
            className="mt-7 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-brand-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {t("ctaButton")}
          </Link>
        </motion.div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>{t("footerTagline")}</p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <Link href="/terms" className="underline transition hover:text-gray-700 dark:hover:text-gray-200">
            {t("footerTerms")}
          </Link>
          <Link href="/privacy" className="underline transition hover:text-gray-700 dark:hover:text-gray-200">
            {t("footerPrivacy")}
          </Link>
        </div>
        <p className="mt-2">© {new Date().getFullYear()} Dilva</p>
      </footer>
    </main>
  );
}
