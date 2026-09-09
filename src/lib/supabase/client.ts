import { createBrowserClient } from "@supabase/ssr";

// Without an explicit maxAge, @supabase/ssr's auth cookie has no
// expiry of its own — some browsers then treat it as a plain session
// cookie, gone the moment the browser/app is closed, which forces a
// fresh login every time. 400 days is the longest a cookie is allowed
// to live (Chrome's own cap) and is what Supabase's docs recommend for
// "stay signed in until I explicitly log out". Must match the value in
// lib/supabase/server.ts and middleware.ts so every code path that
// touches this cookie agrees on its lifetime.
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

/**
 * Supabase client for use in Client Components ("use client").
 * Reads/writes the auth session via browser cookies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { maxAge: AUTH_COOKIE_MAX_AGE } }
  );
}
