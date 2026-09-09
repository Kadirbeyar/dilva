import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Keep in sync with lib/supabase/client.ts's AUTH_COOKIE_MAX_AGE —
// same reasoning: without this, the auth cookie has no expiry of its
// own and some browsers drop it as soon as the app/browser is closed,
// forcing a fresh login. 400 days is Chrome's own cap on cookie
// lifetime and matches Supabase's recommendation for "stay signed in
// until I log out".
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

/**
 * Supabase client for use in Server Components, Route Handlers and
 * Server Actions. Must be created fresh per-request (cookies() is
 * request-scoped).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { maxAge: AUTH_COOKIE_MAX_AGE },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — middleware already
            // refreshes the session, so this can be safely ignored.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses Row Level Security. ONLY use this
 * server-side, for trusted operations like Stripe webhooks. Never
 * import this from a Client Component or expose the key to the browser.
 */
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
