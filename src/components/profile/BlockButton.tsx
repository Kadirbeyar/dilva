"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Small text-link style toggle (not a big call-to-action button like
 * Follow/Wave — blocking is a rarer, more deliberate action) that sits
 * on a public profile. See /api/users/[username]/block for what this
 * actually enforces (existing conversations go silent too, not just
 * new ones — and both Nearby/Matches already exclude blocked people).
 */
export default function BlockButton({
  username,
  initialBlocked,
}: {
  username: string;
  initialBlocked: boolean;
}) {
  const t = useTranslations("profile");
  const [blocked, setBlocked] = useState(initialBlocked);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function toggle() {
    if (loading) return;
    // Blocking is the one-way, more consequential direction — confirm
    // it once; unblocking needs no confirmation.
    if (!blocked && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/block`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBlocked(data.blocked);
      }
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400">{t("confirmBlock")}</span>
        <button
          onClick={toggle}
          disabled={loading}
          className="font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          {t("block")}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-gray-500 hover:underline dark:text-gray-400"
        >
          {t("cancel")}
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium transition disabled:opacity-50 ${
        blocked
          ? "text-brand-600 hover:underline dark:text-brand-400"
          : "text-gray-500 hover:text-red-600 hover:underline dark:text-gray-400"
      }`}
    >
      {blocked ? t("unblock") : t("block")}
    </button>
  );
}
