"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/**
 * The "danger zone" at the bottom of Settings — permanently deletes
 * the signed-in user's account (see /api/account/delete). Requires
 * typing the account's own username to confirm rather than a fixed
 * word like "DELETE": it works the same in every locale without
 * needing an exact-match translation, and the user already knows it.
 */
export default function DeleteAccountSection({ username }: { username: string }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const router = useRouter();

  const [expanded, setExpanded] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim().toLowerCase() === username.toLowerCase();

  async function handleDelete() {
    if (!canDelete || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/account/delete", { method: "POST" }).catch(() => null);
    setSubmitting(false);
    if (!res || !res.ok) {
      setError(tc("error"));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mt-4 rounded-3xl border border-red-200 bg-red-50/60 p-6 dark:border-red-900/40 dark:bg-red-950/20"
    >
      <h2 className="text-sm font-bold text-red-700 dark:text-red-400">{t("dangerZoneTitle")}</h2>
      <p className="mt-1 text-xs text-red-700/80 dark:text-red-400/80">{t("deleteAccountWarning")}</p>

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          {t("deleteAccountButton")}
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex flex-col gap-2 overflow-hidden"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs text-red-700 dark:text-red-400">
                {t("deleteAccountConfirmHint", { username })}
              </span>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                className="rounded-xl border border-red-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none dark:border-red-800 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="mt-1 flex gap-2">
              <button
                disabled={!canDelete || submitting}
                onClick={handleDelete}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                {submitting ? tc("loading") : t("deleteAccountConfirmButton")}
              </button>
              <button
                onClick={() => {
                  setExpanded(false);
                  setConfirmText("");
                  setError(null);
                }}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                {tc("cancel")}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
