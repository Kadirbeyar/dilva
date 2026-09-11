import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require a signed-in user. Matched against the path
// AFTER the locale prefix has been stripped, e.g. /ku/chat -> /chat.
const PROTECTED_PATHS = [
  "/feed",
  "/matches",
  "/chat",
  "/premium",
  "/nearby",
  "/voice-rooms",
  "/visitors",
  "/onboarding",
  "/settings",
  "/admin",
];

function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    return "/" + segments.slice(2).join("/");
  }
  return pathname;
}

// Genuinely static pages: nothing on them ever depends on whether the
// visitor is signed in, so the middleware skips the Supabase auth check
// entirely for these (see the early return in middleware()) rather than
// unconditionally calling supabase.auth.getUser() on every request.
//
// getUser() makes a real network round-trip to Supabase's Auth API
// (that's what lets it also refresh an expiring session) — running it
// on EVERY navigation was adding noticeable latency across the whole
// site, not just DB-heavy pages, so it's skipped wherever the answer
// genuinely doesn't matter.
const STATIC_NO_AUTH_PATHS = ["/terms", "/privacy", "/install"];

// Guest-facing pages that DO need to know whether the visitor is signed
// in — not to gate them (a logged-out visitor sees them normally), but
// to bounce an ALREADY signed-in visitor onward to /feed (or
// /onboarding) instead of showing them the marketing homepage or a
// login form again.
//
// This is what was behind "it logs me out every time I close and
// reopen the app": these pages never checked auth at all, so relaunching
// the installed app/PWA — which always opens back at "/" — landed on
// the guest homepage regardless of whether the session cookie was still
// perfectly valid. It looked exactly like being logged out even when it
// wasn't.
const AUTH_AWARE_GUEST_PATHS = ["/", "/login", "/signup"];

// Keep in sync with lib/supabase/client.ts and lib/supabase/server.ts —
// without an explicit maxAge, @supabase/ssr's auth cookie has no
// expiry of its own and some browsers drop it as soon as the
// app/browser closes, forcing a fresh login every time. 400 days is
// Chrome's own cap on cookie lifetime. The middleware is what actually
// re-writes this cookie on almost every request (see step 2 below), so
// this is the setting that matters most for "stay signed in".
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export async function middleware(request: NextRequest) {
  // 1. Run next-intl's locale detection/redirect first.
  const intlResponse = intlMiddleware(request);
  const response = intlResponse ?? NextResponse.next();

  const cleanPath = stripLocale(request.nextUrl.pathname);
  const isStaticNoAuth = STATIC_NO_AUTH_PATHS.some(
    (p) => cleanPath === p || cleanPath.startsWith(p + "/")
  );
  if (isStaticNoAuth) {
    return response;
  }

  // 2. Refresh the Supabase session (this is what lets server
  //    components read a valid session via cookies).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { maxAge: AUTH_COOKIE_MAX_AGE },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // supabase.auth.getUser() talks to Supabase's Auth API over the
  // network (to validate/refresh the session) — it does NOT throw on
  // a network failure, it just resolves with user: null and an error
  // describing what went wrong. Destructuring only `user` (as this
  // used to) throws that error away, so a transient connectivity blip
  // to Supabase looked EXACTLY like being signed out: every visit to
  // a protected page would force-redirect to /login. We only want to
  // do that when Supabase has actually confirmed there's no session —
  // not when we simply failed to ask.
  let user = null;
  let authNetworkError = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    if (error && error.name !== "AuthSessionMissingError") {
      // Any error other than "there's genuinely no session" (expired
      // refresh token, fetch failure, timeout, etc.) is treated as
      // "couldn't verify" rather than "signed out" — fail open here
      // and let the page's own data fetches surface a retry UI
      // instead of bouncing the user to login.
      authNetworkError = true;
    }
  } catch {
    authNetworkError = true;
  }

  // An already signed-in visitor landing on the homepage/login/signup
  // (typically from relaunching the installed app/PWA, which always
  // opens back at "/") gets sent straight to /feed — or /onboarding if
  // they never finished their profile — instead of seeing the guest
  // marketing page or a login form as if they'd been signed out.
  const isAuthAwareGuestPath = AUTH_AWARE_GUEST_PATHS.some(
    (p) => cleanPath === p || cleanPath.startsWith(p + "/")
  );
  if (isAuthAwareGuestPath && user && !authNetworkError) {
    const locale = request.nextUrl.pathname.split("/")[1] || routing.defaultLocale;
    const onboarded = Boolean((user.user_metadata as { onboarded?: boolean } | undefined)?.onboarded);
    return NextResponse.redirect(new URL(`/${locale}/${onboarded ? "feed" : "onboarding"}`, request.url));
  }

  const requiresAuth = PROTECTED_PATHS.some(
    (p) => cleanPath === p || cleanPath.startsWith(p + "/")
  );

  if (requiresAuth && !user && !authNetworkError) {
    const locale = request.nextUrl.pathname.split("/")[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Force-complete onboarding: a signed-in user who hasn't finished it
  // (username + country + native/target languages, set together by
  // POST /api/profile/complete) gets sent to /onboarding from
  // anywhere else in the app, so there's no way to "escape" onto the
  // feed/chat/etc. with a half-filled profile. `onboarded` lives on
  // the Supabase session's own user_metadata (set at the end of
  // profile/complete) rather than a DB column, so this reuses the
  // supabase.auth.getUser() call above instead of adding a Prisma
  // query to every single navigation.
  const EXEMPT_FROM_ONBOARDING = ["/onboarding", "/login", "/signup", "/terms", "/privacy", "/install"];
  const onboarded = Boolean((user?.user_metadata as { onboarded?: boolean } | undefined)?.onboarded);
  const exempt = EXEMPT_FROM_ONBOARDING.some((p) => cleanPath === p || cleanPath.startsWith(p + "/"));

  if (user && !authNetworkError && !onboarded && !exempt) {
    const locale = request.nextUrl.pathname.split("/")[1] || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static files, images, and API webhook routes that must not
    // be locale-prefixed (Stripe/LibreTranslate hit /api/* directly).
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
