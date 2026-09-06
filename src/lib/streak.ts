import { prisma } from "@/lib/prisma";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10); // UTC calendar day
}

/**
 * HelloTalk-style daily streak — computed on the fly from existing
 * activity (posts, sent messages, comments, corrections) instead of
 * a dedicated counter column, so no migration is needed. "Active"
 * means the user did at least one of those things that day.
 *
 * Deliberately ONE round trip (a raw UNION ALL across the four
 * tables) rather than four separate queries: Dilva's DB connection
 * goes through Supabase's pooler with connection_limit=1 and has
 * meaningful network latency, so four concurrent/sequential queries
 * per request was enough to exhaust the pool under normal load
 * (P2024 "Timed out fetching a new connection"). One query avoids
 * that entirely.
 *
 * Today doesn't break the streak until the day is actually over —
 * if they haven't done anything yet today, we just start counting
 * from yesterday instead of zeroing out.
 */
export async function getActivityStreak(userId: string): Promise<{ streak: number; activeToday: boolean }> {
  const rows = await prisma.$queryRaw<{ createdAt: Date }[]>`
    select "createdAt" from (
      select "createdAt" from posts where "authorId" = ${userId}::uuid
      union all
      select "createdAt" from messages where "senderId" = ${userId}::uuid
      union all
      select "createdAt" from comments where "authorId" = ${userId}::uuid
      union all
      select "createdAt" from corrections where "authorId" = ${userId}::uuid
    ) activity
    order by "createdAt" desc
    limit 400
  `;

  const days = new Set<string>();
  for (const row of rows) {
    days.add(dayKey(row.createdAt));
  }

  const today = new Date();
  const activeToday = days.has(dayKey(today));

  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  if (!activeToday) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { streak, activeToday };
}
