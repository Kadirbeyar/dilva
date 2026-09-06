"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

export type ReportedPost = {
  reportId: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: { username: string; displayName: string | null };
  post: { id: string; content: string; author: { username: string; displayName: string | null } };
};

const REASON_KEY: Record<string, string> = {
  SEXUAL_CONTENT: "reasonSexual",
  SPAM: "reasonSpam",
  HARASSMENT: "reasonHarassment",
  OTHER: "reasonOther",
};

/** Admin queue for posts other users have flagged — see /api/posts/[id]/report. */
export default function ReportedPostsPanel({ initialReports }: { initialReports: ReportedPost[] }) {
  const t = useTranslations("admin");
  const tr = useTranslations("report");
  const [reports, setReports] = useState(initialReports);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function dismiss(reportId: string) {
    setBusyId(reportId);
    const res = await fetch(`/api/admin/reports/${reportId}`, { method: "PATCH" });
    setBusyId(null);
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.reportId !== reportId));
    }
  }

  async function removePost(reportId: string) {
    setBusyId(reportId);
    const res = await fetch(`/api/admin/reports/${reportId}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      const { post } = reports.find((r) => r.reportId === reportId) ?? { post: null };
      setReports((prev) => prev.filter((r) => r.post.id !== post?.id));
    }
  }

  return (
    <div className="card-shadow rounded-2xl bg-white p-5 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("reportedPostsTitle")}</h2>

      {reports.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("reportedPostsEmpty")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {reports.map((r) => (
              <motion.li
                key={r.reportId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-red-600">
                    {tr(REASON_KEY[r.reason] as any) ?? r.reason}
                  </span>
                  <span>
                    {t("reportedBy")} @{r.reporter.username}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
                  {r.post.content}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  @{r.post.author.username}
                </p>
                {r.details && (
                  <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">"{r.details}"</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => dismiss(r.reportId)}
                    disabled={busyId === r.reportId}
                    className="rounded-full px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t("dismiss")}
                  </button>
                  {confirmingId === r.reportId ? (
                    <button
                      onClick={() => removePost(r.reportId)}
                      disabled={busyId === r.reportId}
                      className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {t("confirmDeletePost")}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(r.reportId)}
                      className="rounded-full px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      {t("deletePost")}
                    </button>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
