"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  MESSAGE_KEY,
  targetHref,
  type NotificationItem,
} from "@/components/layout/NotificationBell";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadFirstPage() {
    const res = await fetch("/api/notifications?take=20");
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications ?? []);
      setCursor(data.nextCursor ?? null);
      setUnreadCount(data.unreadCount ?? 0);
      setLoaded(true);
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const res = await fetch(`/api/notifications?take=20&cursor=${cursor}`);
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => [...prev, ...(data.notifications ?? [])]);
      setCursor(data.nextCursor ?? null);
    }
    setLoadingMore(false);
  }

  useEffect(() => {
    loadFirstPage();
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      <div className="card-shadow mt-4 overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
        {!loaded ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
        ) : (
          <AnimatePresence initial={false}>
            <ul>
              {items.map((n) => {
                const href = targetHref(n);
                const body = (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-start gap-3 border-b border-black/5 px-4 py-3.5 text-sm transition last:border-0 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-gray-900 ${
                      !n.isRead ? "bg-brand-50/60 dark:bg-brand-900/10" : ""
                    }`}
                  >
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      {n.fromUser?.avatarUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.fromUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="flex-1 pt-1.5">
                      {t(MESSAGE_KEY[n.type] as any, { name: actorName(n) })}
                    </span>
                    {!n.isRead && <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </motion.div>
                );

                return (
                  <li key={n.id} onClick={() => !n.isRead && markOneRead(n.id)}>
                    {href ? (
                      <Link href={href as any}>{body}</Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          </AnimatePresence>
        )}
      </div>

      {cursor && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium card-shadow disabled:opacity-50 dark:bg-gray-800"
          >
            {loadingMore ? "…" : tc("next")}
          </button>
        </div>
      )}
    </main>
  );
}
