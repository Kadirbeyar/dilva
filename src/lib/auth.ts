import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * This app's Supabase project is in ap-northeast-2 (South Korea), so a
 * single slow/dropped connection from a distant or unstable network can
 * make one database query fail even though the account and session are
 * completely fine. Rather than let that one blip make the whole page
 * look "signed out" (empty nav, blank profile, etc.), retry once after
 * a short pause before giving up — smooths over exactly that kind of
 * one-off hiccup without masking a real, sustained outage.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 400): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return withRetry(fn, retries - 1, delayMs);
  }
}

/**
 * supabase.auth.getUser() talks to Supabase's Auth API over the network
 * to validate the session — like the middleware, it resolves (rather
 * than throws) even when that call fails, so a transient connectivity
 * blip to ap-northeast-2 looks exactly like "no session" unless we
 * check `error` ourselves. This is what MainLayout's nav renders from,
 * so an unchecked blip here made the whole nav (name, gear icon,
 * logout button) disappear even though the session cookie was fine.
 * Retry once, same as withRetry() below for the profile lookup, and
 * only treat it as genuinely signed out when Supabase confirms there's
 * no session.
 *
 * (This used to also call getSession() first and log every attempt as
 * a diagnostic while tracking down a "valid cookie reported as no
 * session" bug — that's resolved now, and both were pure overhead:
 * getSession() added nothing getUser() doesn't already tell us, and on
 * every retry the extra round trip to ap-northeast-2 was adding real,
 * user-visible latency to every single authenticated request.)
 */
async function getAuthUser(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ id: string } | null> {
  for (let attempt = 0; attempt <= 1; attempt++) {
    const { data, error } = await supabase.auth.getUser();
    if (!error || error.name === "AuthSessionMissingError") {
      return data.user;
    }
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  return null;
}

/**
 * Resolves the currently signed-in Dilva user (Supabase auth session
 * + the matching public.users profile row) for use in Server
 * Components and Route Handlers. Returns null when signed out.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const authUser = await getAuthUser(supabase);

  if (!authUser) return null;

  const profile = await withRetry(() =>
    prisma.user.findUnique({ where: { id: authUser.id } })
  );
  return profile;
}

/**
 * Same as getCurrentUser but throws a 401-style error when signed out —
 * convenient at the top of Route Handlers that require auth.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Unauthorized");
  }
  return user;
}

/**
 * Same as requireUser but also requires user.isAdmin — gates the
 * /admin stats dashboard and its API. Throws AuthError (401) when
 * signed out, or ForbiddenError (403) when signed in but not an
 * admin, so callers can tell the two apart if they want to.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!user.isAdmin) {
    throw new ForbiddenError("Forbidden");
  }
  return user;
}

export class AuthError extends Error {
  status = 401;
}

export class ForbiddenError extends Error {
  status = 403;
}
