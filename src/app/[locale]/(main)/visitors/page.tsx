"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import VerifiedBadge from "@/components/profile/VerifiedBadge";

type Visitor = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPremiumCached?: boolean;
  visitedAt: string;
};

export default function VisitorsPage() {
  const t = useTranslations("visitors");
  const tc = useTranslations("common");
  const router = useRouter();

  const [data, setData] = useState<{ premium: boolean; count: number; visitors: Visitor[] } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/visitors")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <main className="relative mx-auto max-w-2xl px-4 py-8">
      <div className="bg-mesh" aria-hidden="true" />
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold"
      >
        {t("title")}
      </motion.h1>

      {!data ? (
        <p className="mt-6 text-gray-500 dark:text-gray-400">{tc("loading")}</p>
      ) : !data.premium ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-shadow-lift mt-6 rounded-3xl bg-white p-8 text-center dark:bg-gray-800"
        >
          <p className="text-5xl font-bold text-gradient">{data.count}</p>
          <h2 className="mt-3 text-lg font-semibold">{t("lockedTitle")}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t("lockedSubtitle")}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/premium")}
            className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
          >
            {t("upgradeButton")}
          </motion.button>
        </motion.div>
      ) : data.visitors.length === 0 ? (
        <p className="mt-8 text-gray-500 dark:text-gray-400">{t("empty")}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {data.visitors.map((v, i) => (
              <motion.li
                key={`${v.id}-${v.visitedAt}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="card-shadow flex items-center gap-3 rounded-2xl bg-white p-3 dark:bg-gray-800"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  {v.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.avatarUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {v.displayName || v.username}
                    {v.isPremiumCached && <VerifiedBadge size="sm" />}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(v.visitedAt).toLocaleString()}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </main>
  );
}
