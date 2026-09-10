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
  initialPlan,
  onClose,
}: {
  bankInfo: string | null;
  cryptoInfo: string | null;
  fibInfo: string | null;
  initialRequest: ManualRequest;
  /** Pre-selects the plan the user tapped on the pricing cards — see PremiumPurchaseFlow. */
  initialPlan?: SubscriptionPlan;
  /**
   * When set, this form is rendered inside PremiumPurchaseFlow's modal
   * instead of standalone on the page: swaps the standalone
   * card/border/margin styling for modal-friendly spacing and shows a
   * close (✕) button.
   */
  onClose?: () => void;
}) {
  const t = useTranslations("premium");
  const [plan, setPlan] = useState<SubscriptionPlan>(initialPlan ?? "MONTH_1");
  const [method, setMethod] = useState<Method>(
    bankInfo ? "BANK_TRANSFER" : fibInfo ? "FIB" : "CRYPTO"
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<ManualRequest>(initialRequest);
  const [error, setError] = useState(false);

  if (!bankInfo && !fibInfo && !cryptoInfo) return null;

  const closeButton = onClose && (
    <div className="mb-2 flex justify-end">
      <button
        onClick={onClose}
        aria-label={t("closeModal")}
        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      >
        ✕
      </button>
    </div>
  );

  if (request?.status === "PENDING") {
    return (
      <div className={onClose ? "" : "mt-8"}>
        {closeButton}
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm dark:border-brand-800 dark:bg-brand-900/20">
          <p className="font-semibold text-brand-800 dark:text-brand-200">
            {t("manualPaymentPendingTitle")}
          </p>
          <p className="mt-1 text-brand-700 dark:text-brand-300">{t("manualPaymentPendingDesc")}</p>
        </div>
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
    <div
      className={
        onClose ? "" : "mt-8 rounded-2xl border border-gray-200 p-5 dark:border-gray-700"
      }
    >
      {closeButton}
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

      {/* Fallback for users who can't complete any of the methods above
          (unsupported bank, no crypto wallet, etc.) — a direct link to
          the owner's personal WhatsApp so they can arrange payment
          another way instead of getting stuck. Number is Dilva's
          support WhatsApp: +964 751 231 9556 (Iraq). */}
      <div className="mt-5 border-t border-gray-100 pt-4 text-center dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("manualPaymentWhatsappNote")}</p>
        <a
          href="https://wa.me/9647512319556"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe57]"
        >
          <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.34.673 4.523 1.836 6.37L4 29l7.82-1.79A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.7c-1.91 0-3.69-.53-5.21-1.45l-.373-.222-4.64 1.062 1.09-4.52-.243-.39A9.66 9.66 0 0 1 5.3 15c0-5.906 4.798-10.7 10.704-10.7 5.906 0 10.7 4.794 10.7 10.7 0 5.906-4.794 10.7-10.7 10.7Zm5.87-8.014c-.32-.16-1.9-.938-2.194-1.045-.294-.107-.508-.16-.722.16-.213.32-.828 1.045-1.016 1.26-.187.213-.374.24-.694.08-.32-.16-1.35-.498-2.572-1.588-.95-.848-1.592-1.895-1.78-2.215-.187-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.187.213-.32.32-.534.107-.213.053-.4-.027-.56-.08-.16-.722-1.74-.99-2.383-.26-.626-.526-.541-.722-.55-.187-.008-.4-.01-.614-.01-.213 0-.56.08-.854.4-.294.32-1.12 1.095-1.12 2.67 0 1.574 1.147 3.096 1.307 3.31.16.213 2.257 3.448 5.468 4.834.764.33 1.36.527 1.826.674.767.244 1.465.21 2.017.128.615-.092 1.9-.777 2.167-1.527.267-.75.267-1.393.187-1.527-.08-.133-.294-.213-.614-.373Z" />
          </svg>
          {t("manualPaymentWhatsappButton")}
        </a>
      </div>
    </div>
  );
}
