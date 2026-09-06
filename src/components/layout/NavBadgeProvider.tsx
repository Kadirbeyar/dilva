"use client";

import { createContext, useContext, useEffect, useState } from "react";

type NavBadgeCounts = { unreadMessages: number; unreadVisitors: number };

const NavBadgeContext = createContext<NavBadgeCounts>({ unreadMessages: 0, unreadVisitors: 0 });

/** Read from NavBar / BottomTabBar to show a number on Chat/Visitors. */
export function useNavBadges() {
  return useContext(NavBadgeContext);
}

/**
 * Polls /api/nav-badges once for the whole layout (NavBar's top links
 * AND the mobile BottomTabBar both read from this one context) rather
 * than each place polling on its own — Dilva's DB connection has
 * connection_limit=1, so three independent 60s polls on the same page
 * would only add pool pressure for no benefit.
 */
export default function NavBadgeProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  const [counts, setCounts] = useState<NavBadgeCounts>({ unreadMessages: 0, unreadVisitors: 0 });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/nav-badges");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setCounts({ unreadMessages: data.unreadMessages ?? 0, unreadVisitors: data.unreadVisitors ?? 0 });
      } catch {
        // silent — a missed badge refresh isn't worth surfacing an error for
      }
    }

    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled]);

  return <NavBadgeContext.Provider value={counts}>{children}</NavBadgeContext.Provider>;
}
