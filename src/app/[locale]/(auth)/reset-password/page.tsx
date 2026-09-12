"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Landed on from the link in the password-reset email (see
 * /api/auth/forgot-password's redirectTo). Supabase's browser client
 * picks up the recovery token in the URL on load and turns it into a
 * short-lived session, firing a PASSWORD_RECOVERY auth event once
 * that's ready — only then can supabase.auth.updateUser() actually
 * change the password. getSession() is also checked directly below,
 * in case that event already fired before this listener attached
 * (a real race on a fast page load).
 */
export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordsDontMatch"));
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(tc("error"));
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
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
          {t("resetPasswordTitle")}
        </h1>

        {!ready ? (
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">{tc("loading")}</p>
        ) : done ? (
          <p className="mt-6 text-center text-sm text-green-600 dark:text-green-400">
            {t("resetPasswordSuccess")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("newPassword")}</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {t("confirmPassword")}
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900"
              />
            </label>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-full bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? tc("loading") : t("resetPasswordCta")}
            </motion.button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
