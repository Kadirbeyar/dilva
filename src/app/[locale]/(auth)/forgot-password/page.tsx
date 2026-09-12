"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, origin: window.location.origin }),
    }).catch(() => {});
    setLoading(false);
    // Always show the same confirmation regardless of the response —
    // see the route's own comment for why (never reveal whether an
    // email has an account).
    setSent(true);
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="bg-mesh" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <Link href="/" className="text-2xl font-extrabold text-gradient">
          Dilva
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card-shadow-lift rounded-3xl bg-white p-7 dark:bg-gray-800"
      >
        <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
          {t("forgotPasswordTitle")}
        </h1>

        {sent ? (
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            {t("forgotPasswordSent")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">{t("forgotPasswordHint")}</p>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("email")}</span>
              <input
                type="email"
                autoCapitalize="none"
                autoCorrect="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900"
              />
            </label>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? tc("loading") : t("forgotPasswordCta")}
            </motion.button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-300">
          <Link href="/login" className="font-medium text-brand-700 underline dark:text-brand-300">
            {t("backToSignIn")}
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
