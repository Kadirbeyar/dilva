"use client";

import { useEffect } from "react";

const HEARTBEAT_MS = 60_000;

/**
 * Mounted once in the main layout. Tells the server "I'm still here"
 * every 60s (see POST /api/presence and lib/presence.ts) so the
 * "online now" filter and green-dot indicators elsewhere in the app
 * actually mean something — previously nothing ever set isOnline at
 * all, so it stayed false for every account forever.
 */
export default function PresenceHeartbeat() {
  useEffect(() => {
    function ping() {
      fetch("/api/presence", { method: "POST" }).catch(() => {});
    }

    ping();
    const interval = setInterval(ping, HEARTBEAT_MS);

    // Best-effort "I'm leaving" — not required for correctness (a
    // stale isOnline expires on its own via lastSeenAt recency, see
    // lib/presence.ts), just makes the green dot disappear sooner.
    function markOffline() {
      navigator.sendBeacon?.(
        "/api/presence",
        new Blob([JSON.stringify({ offline: true })], { type: "application/json" })
      );
    }
    window.addEventListener("pagehide", markOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", markOffline);
    };
  }, []);

  return null;
}
