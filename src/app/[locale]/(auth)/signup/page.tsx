"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { captureReferralFromUrl } from "@/lib/referralCapture";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Covers a signup link shared directly (dilva.app/.../signup?ref=...)
  // rather than through the landing page — see lib/referralCapture.ts.
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("signInError"));
      return;
    }

    setLoading(true);
    // Goes through /api/auth/signup (a server route) rather than calling
    // supabase.auth.signUp directly from the browser, so a session
    // issued immediately (when email confirmation is disabled) is set
    // via a real Set-Cookie header — see that route's comment for why
    // this matters on iOS.
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, origin: window.location.origin }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(res.status === 429 ? tc("tooManyRequests") : data.error || t("signInError"));
      return;
    }

    setSuccess(true);
    // If email confirmation is disabled in the Supabase project, the
    // user already has a session — send them straight to onboarding.
    router.push("/onboarding");
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
        <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white">{t("signUp")}</h1>

        <AnimatePresence>
          {success && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden rounded-xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300"
            >
              {t("signUpSuccess")}
            </motion.p>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("email")}</span>
            <input
              type="email"
              required
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("password")}</span>
            <input
              type="password"
              required
              minLength={8}
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("confirmPassword")}</span>
            <input
              type="password"
              required
              placeholder={t("confirmPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900"
            />
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? tc("loading") : t("signUpCta")}
          </motion.button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-300">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-medium text-brand-700 underline dark:text-brand-300">
            {t("signInCta")}
          </Link>
        </p>

        <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
          {t.rich("agreeToLegal", {
            terms: (chunks) => (
              <Link href="/terms" className="underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </motion.div>
    </main>
  );
}
