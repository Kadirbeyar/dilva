"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type NotificationUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
} | null;

type NotificationType =
  | "NEW_MESSAGE"
  | "NEW_LIKE"
  | "NEW_COMMENT"
  | "NEW_CORRECTION"
  | "NEW_FOLLOWER"
  | "PROFILE_VISIT"
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_EXPIRING"
  | "SYSTEM"
  | "MANUAL_PAYMENT_REJECTED";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  fromUser: NotificationUser;
};

export const MESSAGE_KEY: Record<NotificationType, string> = {
  NEW_MESSAGE: "newMessage",
  NEW_LIKE: "newLike",
  NEW_COMMENT: "newComment",
  NEW_CORRECTION: "newCorrection",
  NEW_FOLLOWER: "newFollower",
  PROFILE_VISIT: "profileVisit",
  SUBSCRIPTION_ACTIVATED: "subscriptionActivated",
  SUBSCRIPTION_EXPIRING: "subscriptionExpiring",
  SYSTEM: "system",
  MANUAL_PAYMENT_REJECTED: "manualPaymentRejected",
};

/** Where clicking a notification should take you. */
export function targetHref(n: NotificationItem): string | null {
  const d = n.data ?? {};
  switch (n.type) {
    case "NEW_LIKE":
    case "NEW_COMMENT":
    case "NEW_CORRECTION":
      return null; // posts don't have a permalink page yet — feed is the source of truth
    case "NEW_FOLLOWER":
    case "PROFILE_VISIT":
      return n.fromUser ? `/profile/${n.fromUser.username}` : null;
    case "NEW_MESSAGE":
      return d.conversationId ? `/chat/${d.conversationId}` : "/chat";
    case "MANUAL_PAYMENT_REJECTED":
      return "/premium";
    default:
      return null;
  }
}

export default function NotificationBell() {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/notifications?take=15");
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setLoaded(true);
    }
  }

  useEffect(() => {
    load();
    // 60s, not 30s: Dilva's DB connection has connection_limit=1 and
    // noticeable network latency, so a slower poll leaves more room
    // for the page's own data fetches to get a connection.
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  async function markOneRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((n) => Math.max(0, n - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  }

  function actorName(n: NotificationItem) {
    return n.fromUser?.displayName || n.fromUser?.username || t("someone");
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("title")}
        className="relative rounded-full p-2 text-gray-500 transition hover:bg-black/5 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="card-shadow absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-white dark:bg-gray-800"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
              <p className="font-semibold">{t("title")}</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
                >
                  {t("markAllRead")}
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!loaded ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">…</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
              ) : (
                <ul>
                  {items.map((n) => {
                    const href = targetHref(n);
                    const body = (
                      <div
                        className={`flex items-start gap-3 px-4 py-3 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-900 ${
                          !n.isRead ? "bg-brand-50/60 dark:bg-brand-900/10" : ""
                        }`}
                      >
                        <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          {n.fromUser?.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={n.fromUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                        <span className="flex-1">
                          {t(MESSAGE_KEY[n.type] as any, { name: actorName(n) })}
                        </span>
                        {!n.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                        )}
                      </div>
                    );

                    return (
                      <li key={n.id} onClick={() => !n.isRead && markOneRead(n.id)}>
                        {href ? (
                          <Link href={href as any} onClick={() => setOpen(false)}>
                            {body}
                          </Link>
                        ) : (
                          body
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-black/5 px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-gray-50 dark:border-white/10 dark:text-brand-300 dark:hover:bg-gray-900"
            >
              {t("title")}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
