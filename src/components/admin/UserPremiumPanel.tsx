"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PLAN_CATALOGUE } from "@/lib/plans";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

const PLAN_ORDER: SubscriptionPlan[] = ["MONTH_1", "MONTH_3", "MONTH_6", "MONTH_12"];

type UserResult = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPremiumCached: boolean;
  premiumBonusUntil: string | null;
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    currentPeriodEnd: string | null;
  } | null;
};

/**
 * Lets an admin search for any user and grant or cancel their Premium
 * by hand — for people who message the Dilva WhatsApp (see
 * ManualPaymentForm's fallback link) because they can't complete any
 * of the bank/FIB/crypto methods on /premium. See
 * /api/admin/users/search and /api/admin/users/[id]/premium.
 */
export default function UserPremiumPanel() {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [planChoice, setPlanChoice] = useState<Record<string, SubscriptionPlan>>({});
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; kind: "granted" | "cancelled" | "error" } | null>(
    null
  );

  async function search() {
    if (query.trim().length < 2) return;
    setSearching(true);
    setSearched(true);
    const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query.trim())}`);
    setSearching(false);
    if (res.ok) {
      const data = await res.json();
      setResults(data.users);
    }
  }

  function isActive(u: UserResult): boolean {
    if (u.isPremiumCached) return true;
    if (u.premiumBonusUntil && new Date(u.premiumBonusUntil).getTime() > Date.now()) return true;
    if (
      u.subscription &&
      (u.subscription.status === "ACTIVE" || u.subscription.status === "TRIALING") &&
      (!u.subscription.currentPeriodEnd || new Date(u.subscription.currentPeriodEnd).getTime() > Date.now())
    ) {
      return true;
    }
    return false;
  }

  function patchUser(id: string, patch: Partial<UserResult>) {
    setResults((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  async function grant(u: UserResult) {
    const plan = planChoice[u.id] ?? "MONTH_1";
    setBusyId(u.id);
    setToast(null);
    const res = await fetch(`/api/admin/users/${u.id}/premium`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant", plan }),
    });
    setBusyId(null);
    if (res.ok) {
      const data = await res.json();
      patchUser(u.id, {
        isPremiumCached: data.user.isPremiumCached,
        premiumBonusUntil: data.user.premiumBonusUntil,
        subscription: data.subscription,
      });
      setToast({ id: u.id, kind: "granted" });
    } else {
      setToast({ id: u.id, kind: "error" });
    }
  }

  async function cancel(u: UserResult) {
    setBusyId(u.id);
    setConfirmingCancel(null);
    setToast(null);
    const res = await fetch(`/api/admin/users/${u.id}/premium`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    setBusyId(null);
    if (res.ok) {
      const data = await res.json();
      patchUser(u.id, {
        isPremiumCached: data.user.isPremiumCached,
        premiumBonusUntil: data.user.premiumBonusUntil,
        subscription: data.subscription,
      });
      setToast({ id: u.id, kind: "cancelled" });
    } else {
      setToast({ id: u.id, kind: "error" });
    }
  }

  return (
    <div className="card-shadow rounded-2xl bg-white p-5 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("userPremiumTitle")}</h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("userPremiumSubtitle")}</p>

      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder={t("userPremiumSearchPlaceholder")}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        <button
          onClick={search}
          disabled={searching || query.trim().length < 2}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t("userPremiumSearchButton")}
        </button>
      </div>

      {searched && !searching && results.length === 0 && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t("userPremiumNoResults")}</p>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {results.map((u) => {
          const active = isActive(u);
          const bonusOnly =
            active &&
            !u.isPremiumCached &&
            u.premiumBonusUntil &&
            new Date(u.premiumBonusUntil).getTime() > Date.now();
          const untilDate = bonusOnly
            ? new Date(u.premiumBonusUntil as string).toLocaleDateString()
            : u.subscription?.currentPeriodEnd
              ? new Date(u.subscription.currentPeriodEnd).toLocaleDateString()
              : null;

          return (
            <li key={u.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                  @{u.username}
                  {u.displayName ? ` · ${u.displayName}` : ""}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    active
                      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {active
                    ? untilDate
                      ? t(bonusOnly ? "userPremiumStatusBonus" : "userPremiumStatusActive", {
                          date: untilDate,
                        })
                      : t("userPremiumStatusActive", { date: "—" })
                    : t("userPremiumStatusNone")}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <select
                  value={planChoice[u.id] ?? "MONTH_1"}
                  onChange={(e) =>
                    setPlanChoice((prev) => ({ ...prev, [u.id]: e.target.value as SubscriptionPlan }))
                  }
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  {PLAN_ORDER.map((p) => (
                    <option key={p} value={p}>
                      {PLAN_CATALOGUE[p].months}mo · ${PLAN_CATALOGUE[p].priceUsd}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => grant(u)}
                  disabled={busyId === u.id}
                  className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {t("userPremiumGrantButton")}
                </button>

                {active &&
                  (confirmingCancel === u.id ? (
                    <button
                      onClick={() => cancel(u)}
                      disabled={busyId === u.id}
                      className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {t("userPremiumCancelConfirm")}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmingCancel(u.id)}
                      disabled={busyId === u.id}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/30"
                    >
                      {t("userPremiumCancelButton")}
                    </button>
                  ))}

                {toast?.id === u.id && (
                  <span
                    className={`text-xs font-medium ${
                      toast.kind === "error" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {toast.kind === "granted"
                      ? t("userPremiumGranted")
                      : toast.kind === "cancelled"
                        ? t("userPremiumCancelled")
                        : t("userPremiumError")}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
