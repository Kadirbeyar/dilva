"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * One-click broadcast: sends `message` to every user's chat inbox as
 * a message from the "Dilva Team" account — see
 * /api/admin/broadcast. Two-step confirm (same pattern as
 * ReportedPostsPanel's delete-post button) so a stray click can't
 * message the entire user base by accident.
 */
export default function BroadcastForm() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [message, setMessage] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/broadcast")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setRecipientCount(data.count);
      })
      .catch(() => {});
  }, []);

  async function send() {
    setSending(true);
    setError(false);
    setSentCount(null);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setSending(false);
    setConfirming(false);
    if (res.ok) {
      const data = await res.json();
      setSentCount(data.sent);
      setMessage("");
    } else {
      setError(true);
    }
  }

  return (
    <div className="card-shadow rounded-2xl bg-white p-5 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("broadcastTitle")}</h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("broadcastSubtitle")}</p>

      <div className="mt-3 flex flex-col gap-3">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setConfirming(false);
          }}
          rows={3}
          placeholder={t("broadcastPlaceholder")}
          className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />

        <div className="flex flex-wrap items-center gap-3">
          {confirming ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={sending}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {sending
                ? t("broadcastSending")
                : t("broadcastConfirm", { count: recipientCount ?? "…" })}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setConfirming(true)}
              disabled={!message.trim()}
              className="self-start rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {t("broadcastButton")}
            </motion.button>
          )}
          {confirming && (
            <button
              onClick={() => setConfirming(false)}
              className="text-xs font-medium text-gray-500 hover:underline dark:text-gray-400"
            >
              {tc("cancel")}
            </button>
          )}
          {sentCount != null && (
            <span className="text-sm text-green-600">
              ✓ {t("broadcastSent", { count: sentCount })}
            </span>
          )}
          {error && <span className="text-sm text-red-600">✕</span>}
        </div>
      </div>
    </div>
  );
}
