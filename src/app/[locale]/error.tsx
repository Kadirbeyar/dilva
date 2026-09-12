"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Catches any otherwise-unhandled error thrown while rendering a page
 * (or its data fetching) anywhere under a locale segment, so a bug
 * shows this instead of Next.js's raw default error screen — which had
 * no way back into the app and nothing translated. Doesn't (and can't)
 * catch errors in [locale]/layout.tsx itself; see global-error.tsx for
 * that outer safety net.
 */
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <main className="relative mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="bg-mesh" aria-hidden="true" />
      <p className="text-4xl">⚠️</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">{t("error")}</p>
      <div className="mt-2 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={reset}
          className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          {t("retry")}
        </motion.button>
        <Link
          href="/"
          className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
        >
          {t("backToHome")}
        </Link>
      </div>
    </main>
  );
}
