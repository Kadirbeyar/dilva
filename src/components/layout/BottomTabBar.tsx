"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

type TabUser = { username: string } | null;

const ICONS: Record<string, (active: boolean) => React.ReactNode> = {
  feed: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  matches: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" strokeLinecap="round" />
      <path d="M16 8.5a2.8 2.8 0 1 1 3.2 4.4M18 20c0-2.6-1.3-4.5-3.3-5.4" strokeLinecap="round" />
    </svg>
  ),
  nearby: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" fill={active ? "white" : "none"} />
    </svg>
  ),
  chat: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v12H8l-4 4V4z" strokeLinejoin="round" />
    </svg>
  ),
  profile: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * HelloTalk-style fixed bottom tab bar, mobile only (`lg:hidden` — the
 * top NavBar's horizontal links cover the same destinations on wider
 * screens). See MainLayout for the matching bottom padding on the
 * page content so this never overlaps it.
 */
export default function BottomTabBar({ user }: { user: TabUser }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const tabs = [
    { key: "feed", href: "/feed", label: t("feed") },
    { key: "matches", href: "/matches", label: t("matches") },
    { key: "nearby", href: "/nearby", label: t("nearby") },
    { key: "chat", href: "/chat", label: t("chat") },
    {
      key: "profile",
      href: user ? (`/profile/${user.username}` as const) : "/settings",
      label: t("profile"),
    },
  ] as const;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur-md lg:hidden dark:border-white/10 dark:bg-gray-900/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href as any}
              className="relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
            >
              {active && (
                <motion.span
                  layoutId="bottom-tab-active"
                  className="absolute top-0.5 h-0.5 w-8 rounded-full bg-brand-600"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className={active ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"}>
                {ICONS[tab.key](active)}
              </span>
              <span className={active ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
