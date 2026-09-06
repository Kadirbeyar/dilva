"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * Lets an admin set (or clear) the floating radio player's stream
 * URL — see components/layout/RadioPlayerButton.tsx, which is hidden
 * entirely for everyone until this is set.
 */
export default function RadioSettingsForm({
  initialUrl,
  initialLabel,
}: {
  initialUrl: string | null;
  initialLabel: string | null;
}) {
  const t = useTranslations("admin");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [label, setLabel] = useState(initialLabel ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(false);
    const res = await fetch("/api/settings/radio", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ radioStreamUrl: url, radioLabel: label }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
    } else {
      setError(true);
    }
  }

  return (
    <div className="card-shadow rounded-2xl bg-white p-5 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("radioTitle")}</h2>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("radioUrlLabel")}</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://stream.example.com/radio.mp3"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <span className="text-[11px] text-gray-400 dark:text-gray-500">{t("radioClearHint")}</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("radioLabelLabel")}</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving}
            className="self-start rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("radioSaveButton")}
          </motion.button>
          {saved && <span className="text-sm text-green-600">✓</span>}
          {error && <span className="text-sm text-red-600">✕</span>}
        </div>
      </div>
    </div>
  );
}
