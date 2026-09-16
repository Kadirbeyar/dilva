"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * Lets a signed-in user change their own password from Settings —
 * previously there was no way to do this at all short of signing out
 * and going through "forgot password" (see /api/account/change-password
 * for the server-side verification this posts to).
 */
export default function ChangePasswordSection() {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const tc = useTranslations("common");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(tAuth("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(tAuth("passwordsDontMatch"));
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).catch(() => null);
    setSubmitting(false);

    if (!res || !res.ok) {
      if (res?.status === 401) setError(t("currentPasswordWrong"));
      else if (res?.status === 429) setError(tc("tooManyRequests"));
      else setError(tc("error"));
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-shadow mt-4 rounded-3xl bg-white p-7 dark:bg-gray-800"
    >
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("changePasswordTitle")}</h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {t("currentPasswordLabel")}
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{tAuth("newPassword")}</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{tAuth("confirmPassword")}</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400">✓ {t("changePasswordSuccess")}</p>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-full bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? tc("loading") : t("changePasswordCta")}
        </motion.button>
      </form>
    </motion.div>
  );
}
