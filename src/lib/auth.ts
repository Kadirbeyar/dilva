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
 */
async function getAuthUser(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ id: string } | null> {
  // Temporary diagnostic: getSession() reads the cookie locally with no
  // network call, so this tells us whether the storage/cookie-parsing
  // layer finds a session at all, independent of anything network- or
  // Supabase-API-related.
  const sessionCheck = await supabase.auth.getSession();
  console.log(
    "[auth] getSession() ->",
    sessionCheck.data.session ? `found, expires_at=${sessionCheck.data.session.expires_at}` : "null",
    sessionCheck.error ? `error=${sessionCheck.error.name}:${sessionCheck.error.message}` : ""
  );

  for (let attempt = 0; attempt <= 1; attempt++) {
    const { data, error } = await supabase.auth.getUser();
    // Temporary diagnostic: log every error (including
    // AuthSessionMissingError, normally treated as "genuinely signed
    // out" and NOT logged) so we can see exactly what Supabase says
    // even in that case, while we track down why a cookie that is
    // definitely present and definitely valid is being reported as
    // "no session".
    if (error) {
      console.log(
        `[auth] getUser() attempt ${attempt + 1}/2 ->`,
        error.name,
        error.message,
        "status" in error ? (error as any).status : undefined
      );
    } else {
      console.log(`[auth] getUser() attempt ${attempt + 1}/2 -> ok, user=${data.user?.id}`);
    }
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
