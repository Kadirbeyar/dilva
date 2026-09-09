"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import SignOutButton from "@/components/layout/SignOutButton";
import ThemeToggle from "@/components/layout/ThemeToggle";
import NotificationBell from "@/components/layout/NotificationBell";
import StreakBadge from "@/components/layout/StreakBadge";
import VerifiedBadge from "@/components/profile/VerifiedBadge";
import { useNavBadges } from "@/components/layout/NavBadgeProvider";

/** Small red count pill shown on a nav link with unread activity. */
function NavBadgeDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ms-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

type NavUser = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin?: boolean;
  isPremiumCached?: boolean;
} | null;

export default function NavBar({ user }: { user: NavUser }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { unreadMessages, unreadVisitors } = useNavBadges();

  const links = [
    { href: "/feed", label: t("feed") },
    { href: "/matches", label: t("matches") },
    { href: "/nearby", label: t("nearby") },
    { href: "/visitors", label: t("visitors"), badge: unreadVisitors },
    { href: "/chat", label: t("chat"), badge: unreadMessages },
    { href: "/premium", label: t("premium") },
  ] as const;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/75 backdrop-blur-md dark:border-white/10 dark:bg-gray-900/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/feed" className="text-xl font-extrabold tracking-tight text-gradient">
          Dilva
        </Link>

        <nav className="hidden items-center gap-0.5 text-sm font-medium lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-full px-3.5 py-2 transition-colors ${
                isActive(link.href)
                  ? "text-brand-700 dark:text-brand-300"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              }`}
            >
              {isActive(link.href) && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-brand-50 dark:bg-brand-900/30"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {link.label}
              {"badge" in link && <NavBadgeDot count={link.badge} />}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          {user && <StreakBadge />}
          {user && <NotificationBell />}
          {user && (
            <Link
              href={`/profile/${user.username}` as any}
              className="flex items-center gap-2 rounded-full py-1 pe-3 ps-1 transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              <span className="h-7 w-7 overflow-hidden rounded-full bg-gray-200">
                {user.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              <span className="text-sm font-medium">
                {user.displayName || user.username}
                {user.isPremiumCached && <VerifiedBadge size="sm" />}
              </span>
            </Link>
          )}
          {user && user.isAdmin && (
            <Link
              href="/admin"
              aria-label={t("admin")}
              className="rounded-full p-2 text-gray-500 transition hover:bg-black/5 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18 17V9M13 17V5M8 17v-4" />
              </svg>
            </Link>
          )}
          {user && (
            <Link
              href="/settings"
              aria-label={t("settings")}
              className="rounded-full p-2 text-gray-500 transition hover:bg-black/5 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          )}
          {user && <SignOutButton label={t("logout")} />}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {user && <StreakBadge />}
          {user && <NotificationBell />}
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-gray-600"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-black/5 lg:hidden dark:border-white/10"
          >
            <div className="flex flex-col gap-1 px-4 py-3 text-sm font-medium">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 ${
                    isActive(link.href)
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {link.label}
                  {"badge" in link && <NavBadgeDot count={link.badge} />}
                </Link>
              ))}
              {user && (
                <Link
                  href={`/profile/${user.username}` as any}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300"
                >
                  {t("profile")}
                </Link>
              )}
              {user && (
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300"
                >
                  {t("settings")}
                </Link>
              )}
              {user && user.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300"
                >
                  {t("admin")}
                </Link>
              )}
              <div className="mt-2 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>
                {user && <SignOutButton label={t("logout")} />}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
