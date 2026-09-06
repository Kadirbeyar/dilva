"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/** HelloTalk-style 🔥 daily streak badge — see /api/streak. */
export default function StreakBadge() {
  const t = useTranslations("nav");
  const [streak, setStreak] = useState<number | null>(null);
  const [activeToday, setActiveToday] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Slight delay so this doesn't fire in the same instant as the
    // notifications bell and the page's own data fetch — Dilva's DB
    // connection has a hard connection_limit=1, so spreading these
    // out avoids piling up pool-timeout errors on page load.
    const id = setTimeout(() => {
      fetch("/api/streak")
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          setStreak(d.streak ?? 0);
          setActiveToday(Boolean(d.activeToday));
        })
        .catch(() => {});
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  if (streak === null || streak === 0) return null;

  return (
    <span
      title={activeToday ? t("streakActive", { count: streak }) : t("streakAtRisk", { count: streak })}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        activeToday
          ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300"
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      🔥 {streak}
    </span>
  );
}
