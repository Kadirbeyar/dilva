import { prisma } from "@/lib/prisma";

/**
 * Thrown when a caller has exceeded a rate limit. Mirrors
 * AuthError/ForbiddenError in lib/auth.ts: route handlers catch this
 * specific class and turn it into a 429 response.
 */
export class RateLimitError extends Error {
  status = 429;
  retryAfterSeconds: number;
  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Simple fixed-window rate limiter backed by the `rate_limits` table
 * (see prisma/sql/12_rate_limits.sql). Deliberately NOT a sliding-window
 * or token-bucket algorithm — those need either multiple queries or an
 * in-memory process, and this project's DB connection goes through
 * Supabase's pooler with connection_limit=1, so "one extra round trip
 * per request, done as a single atomic upsert" is the actual design
 * constraint, not just a nice-to-have.
 *
 * `key` should already identify both the action and the actor, e.g.
 * `post_create:${userId}` or `message_send:${userId}`. Throws
 * RateLimitError when the caller has made more than `limit` calls with
 * this key inside the current `windowSeconds`-long window; otherwise
 * resolves normally (the call already counts toward the window).
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<void> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limits" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart")
    DO UPDATE SET "count" = "rate_limits"."count" + 1
    RETURNING "count";
  `;
  const count = Number(rows[0]?.count ?? 1);

  // Opportunistic cleanup instead of a cron job: on a small random
  // fraction of calls, delete windows old enough that nothing could
  // still be checking them. Cheap enough to run inline (it's a single
  // indexed range delete) without adding a second query to every call.
  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.$executeRaw`DELETE FROM "rate_limits" WHERE "windowStart" < ${cutoff}`;
  }

  if (count > limit) {
    // Seconds until the current fixed window rolls over.
    const retryAfterSeconds = Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000);
    throw new RateLimitError("Too many requests", Math.max(retryAfterSeconds, 1));
  }
}
