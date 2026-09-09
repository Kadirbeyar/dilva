"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getPushStatus,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushClient";

/**
 * Lets a user turn on/off browser push notifications (new chat
 * messages, admin announcements — see lib/webpush.ts for what
 * actually sends them). Shown in Settings; renders nothing on a
 * browser that doesn't support the Push API at all (e.g. iOS Safari
 * before 16.4, or a device without notification permission support),
 * rather than showing a toggle that could never work.
 */
export default function PushNotificationToggle() {
  const t = useTranslations("settings");
  const [status, setStatus] = useState<
    "checking" | "unsupported" | "denied" | "subscribed" | "unsubscribed"
  >("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }
    getPushStatus().then(setStatus);
  }, []);

  async function handleToggle(next: boolean) {
    setBusy(true);
    if (next) {
      const ok = await subscribeToPush();
      setStatus(ok ? "subscribed" : Notification.permission === "denied" ? "denied" : "unsubscribed");
    } else {
      await unsubscribeFromPush();
      setStatus("unsubscribed");
    }
    setBusy(false);
  }

  if (status === "checking" || status === "unsupported") return null;

  return (
    <div className="card-shadow mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 dark:bg-gray-800">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t("pushTitle")}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {status === "denied" ? t("pushDeniedHint") : t("pushHint")}
        </p>
      </div>
      <button
        onClick={() => handleToggle(status !== "subscribed")}
        disabled={busy || status === "denied"}
        aria-pressed={status === "subscribed"}
        className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
          status === "subscribed" ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            status === "subscribed" ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
