/**
 * Online-presence helpers.
 *
 * `User.isOnline` alone was never actually maintained anywhere in the
 * app (nothing ever set it to true, and nothing ever flipped it back
 * to false), so it stayed permanently `false` for every account —
 * which is why the "online now" filter on the Matches/search page and
 * the green-dot indicators in chat always came back empty. A
 * heartbeat (see POST /api/presence, called periodically by
 * <PresenceHeartbeat/> in the main layout) now sets isOnline=true and
 * bumps lastSeenAt while a tab is open.
 *
 * Rather than trying to reliably catch every way a tab can disappear
 * (closed, crashed, phone locked, wifi dropped) to flip isOnline back
 * to false, "online" is defined as isOnline=true AND lastSeenAt
 * within the last ONLINE_WINDOW_MS. A stale flag from a vanished tab
 * simply expires on its own next time anyone reads it.
 */
export const ONLINE_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

/** Prisma `where` fragment for "online right now" — spread into a query's where clause. */
export function onlineWhere() {
  return {
    isOnline: true as const,
    lastSeenAt: { gte: new Date(Date.now() - ONLINE_WINDOW_MS) },
  };
}

/** True if this user counts as online right now (for display, not just DB filtering). */
export function computeIsOnline(u: { isOnline: boolean; lastSeenAt: Date | string | null }): boolean {
  if (!u.isOnline || !u.lastSeenAt) return false;
  return Date.now() - new Date(u.lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}
