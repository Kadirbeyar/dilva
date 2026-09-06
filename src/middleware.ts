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

export async function middleware(request: NextRequest) {
  // 1. Run next-intl's locale detection/redirect first.
  const intlResponse = intlMiddleware(request);

  // 2. Refresh the Supabase session (this is what lets server
  //    components read a valid session via cookies).
  const response = intlResponse ?? NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const cleanPath = stripLocale(request.nextUrl.pathname);
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
  const EXEMPT_FROM_ONBOARDING = ["/onboarding", "/login", "/signup"];
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
