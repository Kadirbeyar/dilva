"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { PLAN_CATALOGUE } from "@/lib/plans";
import type { SubscriptionPlan } from "@prisma/client";

export type ManualPaymentRequestItem = {
  id: string;
  plan: SubscriptionPlan;
  method: "BANK_TRANSFER" | "CRYPTO";
  note: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { username: string; displayName: string | null; avatarUrl: string | null };
};

const METHOD_KEY: Record<ManualPaymentRequestItem["method"], string> = {
  BANK_TRANSFER: "manualPaymentMethodBank",
  CRYPTO: "manualPaymentMethodCrypto",
};

const STATUS_KEY: Record<ManualPaymentRequestItem["status"], string> = {
  PENDING: "manualPaymentStatusPending",
  APPROVED: "manualPaymentStatusApproved",
  REJECTED: "manualPaymentStatusRejected",
};

/** Admin review queue for manual (bank/crypto) Premium payment claims — see /api/admin/manual-payments. */
export default function ManualPaymentsPanel({
  initialRequests,
}: {
  initialRequests: ManualPaymentRequestItem[];
}) {
  const t = useTranslations("admin");
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "PENDING");
  const reviewed = requests.filter((r) => r.status !== "PENDING").slice(0, 8);

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    const res = await fetch(`/api/admin/manual-payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    if (res.ok) {
      const data = await res.json();
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.request } : r)));
    }
  }

  function displayName(u: ManualPaymentRequestItem["user"]) {
    return u.displayName || u.username;
  }

  return (
    <div className="card-shadow rounded-2xl bg-white p-5 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
        {t("manualPaymentsTitle")}
      </h2>

      {pending.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("manualPaymentsEmpty")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {pending.map((r) => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    @{r.user.username}
                    {r.user.displayName ? ` · ${displayName(r.user)}` : ""}
                  </span>
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    {PLAN_CATALOGUE[r.plan].months}mo · ${PLAN_CATALOGUE[r.plan].priceUsd}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {t(METHOD_KEY[r.method] as any)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
                  {r.note}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => review(r.id, "approve")}
                    disabled={busyId === r.id}
                    className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {t("manualPaymentApprove")}
                  </button>
                  <button
                    onClick={() => review(r.id, "reject")}
                    disabled={busyId === r.id}
                    className="rounded-full px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/30"
                  >
                    {t("manualPaymentReject")}
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {reviewed.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-3 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("manualPaymentsRecent")}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {reviewed.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300"
              >
                <span>
                  @{r.user.username} · {PLAN_CATALOGUE[r.plan].months}mo
                </span>
                <span
                  className={
                    r.status === "APPROVED"
                      ? "font-medium text-green-600"
                      : "font-medium text-red-500"
                  }
                >
                  {t(STATUS_KEY[r.status] as any)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
