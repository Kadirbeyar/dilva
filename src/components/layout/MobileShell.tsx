"use client";

import { usePathname } from "@/i18n/navigation";
import BottomTabBar from "./BottomTabBar";

type ShellUser = { username: string } | null;

/**
 * Wraps the page content + the mobile BottomTabBar together so both
 * can agree on one thing: an open chat thread (/chat/[id]) is full
 * height edge-to-edge with its own composer pinned to the real
 * bottom of the screen — same as HelloTalk hides its bottom nav
 * inside a conversation — so neither the tab bar nor its normal
 * bottom-padding spacer should show up there. Everywhere else both
 * appear as usual.
 */
export default function MobileShell({ children, user }: { children: React.ReactNode; user: ShellUser }) {
  const pathname = usePathname();
  const isChatThread = /^\/chat\/.+/.test(pathname);

  return (
    <>
      <div className={`flex-1 bg-gray-50/50 dark:bg-transparent ${isChatThread ? "" : "pb-16 lg:pb-0"}`}>
        {children}
      </div>
      {user && !isChatThread && <BottomTabBar user={user} />}
    </>
  );
}
