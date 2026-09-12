import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

// Signs in through the SERVER Supabase client (not the browser one) so
// the session cookies reach the browser via a real HTTP Set-Cookie
// response header instead of being written with document.cookie from
// client-side JS.
//
// This matters specifically on iOS Safari, and even more so inside an
// iOS "Add to Home Screen" standalone web app: Safari's Intelligent
// Tracking Prevention caps and aggressively evicts any cookie that was
// written by JavaScript ("script-writable storage") — especially once
// the tab/app is backgrounded — which is exactly why users were being
// signed out every time they left Dilva and reopened it. Cookies set
// via a genuine Set-Cookie header are not subject to that cap.
export async function POST(request: Request) {
  const { identifier, password } = await request.json().catch(() => ({}));
  if (!identifier || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Two limits at once: by IP (stops one machine from hammering many
  // accounts) and by the identifier being attempted (stops many
  // machines/IPs from brute-forcing one specific account). Generous
  // enough that a real person mistyping their password a few times
  // never notices.
  try {
    await enforceRateLimit(`login_ip:${clientIp(request)}`, 20, 300);
    await enforceRateLimit(`login_id:${identifier.toLowerCase()}`, 8, 300);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSeconds: err.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
      );
    }
    throw err;
  }

  // Supabase Auth only ever signs in with an email — a username typed
  // here has to be resolved to its account's email first (via the
  // denormalized public.users.email column, kept in sync by the
  // signup trigger; see prisma/sql/17_username_login.sql). Looked up
  // case-insensitively so "Ahmad"/"ahmad" both resolve to the one
  // account that functional unique index guarantees exists.
  let email: string = identifier;
  if (!identifier.includes("@")) {
    const account = await prisma.user.findFirst({
      where: { username: { equals: identifier, mode: "insensitive" } },
      select: { email: true },
    });
    // No matching username, or a pre-migration account with no email
    // on file yet — fall through to signInWithPassword anyway so the
    // error response is identical either way (never reveal whether a
    // username exists via a different error).
    if (account?.email) {
      email = account.email;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
