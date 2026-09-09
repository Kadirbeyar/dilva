"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PLAN_CATALOGUE } from "@/lib/plans";
import type { SubscriptionPlan } from "@prisma/client";

const PLAN_ORDER: SubscriptionPlan[] = ["MONTH_1", "MONTH_3", "MONTH_6", "MONTH_12"];

type Method = "BANK_TRANSFER" | "CRYPTO" | "FIB";

type ManualRequest = {
  id: string;
  plan: SubscriptionPlan;
  method: Method;
  status: "PENDING" | "APPROVED" | "REJECTED";
} | null;

/**
 * Alternative to the Stripe checkout button for users Stripe can't
 * reach (Iraq and much of the world today): shows the admin-editable
 * bank/Qi Card + crypto instructions, then lets the user say "I
 * already sent it" with a short note (sender name, last digits, a tx
 * hash) — an admin reviews and approves from /admin. See
 * /api/premium/manual-request and /api/admin/manual-payments.
 */
export default function ManualPaymentForm({
  bankInfo,
  cryptoInfo,
  fibInfo,
  initialRequest,
}: {
  bankInfo: string | null;
  cryptoInfo: string | null;
  fibInfo: string | null;
  initialRequest: ManualRequest;
}) {
  const t = useTranslations("premium");
  const [plan, setPlan] = useState<SubscriptionPlan>("MONTH_1");
  const [method, setMethod] = useState<Method>(
    bankInfo ? "BANK_TRANSFER" : fibInfo ? "FIB" : "CRYPTO"
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<ManualRequest>(initialRequest);
  const [error, setError] = useState(false);

  if (!bankInfo && !fibInfo && !cryptoInfo) return null;

  if (request?.status === "PENDING") {
    return (
      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm dark:border-brand-800 dark:bg-brand-900/20">
        <p className="font-semibold text-brand-800 dark:text-brand-200">
          {t("manualPaymentPendingTitle")}
        </p>
        <p className="mt-1 text-brand-700 dark:text-brand-300">{t("manualPaymentPendingDesc")}</p>
      </div>
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(false);
    const res = await fetch("/api/premium/manual-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, method, note }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setRequest(data.request);
    } else {
      setError(true);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
      <h2 className="text-lg font-semibold">{t("manualPaymentTitle")}</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t("manualPaymentSubtitle")}</p>

      {request?.status === "REJECTED" && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {t("manualPaymentRejectedNotice")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {PLAN_ORDER.map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              plan === p
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {PLAN_CATALOGUE[p].months}mo · ${PLAN_CATALOGUE[p].priceUsd}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        {bankInfo && (
          <button
            onClick={() => setMethod("BANK_TRANSFER")}
            className={`flex-1 rounded-xl border p-3 text-start text-sm transition ${
              method === "BANK_TRANSFER"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <p className="font-semibold">{t("manualPaymentMethodBankTitle")}</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-300">
              {bankInfo}
            </p>
          </button>
        )}
        {fibInfo && (
          <button
            onClick={() => setMethod("FIB")}
            className={`flex-1 rounded-xl border p-3 text-start text-sm transition ${
              method === "FIB"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <p className="font-semibold">{t("manualPaymentMethodFibTitle")}</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-300">
              {fibInfo}
            </p>
          </button>
        )}
        {cryptoInfo && (
          <button
            onClick={() => setMethod("CRYPTO")}
            className={`flex-1 rounded-xl border p-3 text-start text-sm transition ${
              method === "CRYPTO"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <p className="font-semibold">{t("manualPaymentMethodCryptoTitle")}</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-300">
              {cryptoInfo}
            </p>
          </button>
        )}
      </div>

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {t("manualPaymentNoteLabel")}
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={t("manualPaymentNotePlaceholder")}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
      </label>

      <button
        onClick={submit}
        disabled={submitting || note.trim().length < 3}
        className="mt-4 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "…" : t("manualPaymentSubmit")}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{t("manualPaymentError")}</p>
      )}
    </div>
  );
}
