import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

// Same reasoning as /api/auth/login: signing up through the server
// client means that if the Supabase project has email confirmation
// disabled and a session is issued immediately, it's written via a real
// Set-Cookie header rather than document.cookie — avoiding the same
// iOS Safari / standalone-web-app logout problem.
export async function POST(request: Request) {
  const { email, password, origin } = await request.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // By IP only (there's no account yet to key on) — generous enough
  // for a household/office sharing one IP to all sign up, tight enough
  // to stop a script from mass-creating accounts.
  try {
    await enforceRateLimit(`signup_ip:${clientIp(request)}`, 8, 3600);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSeconds: err.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
      );
    }
    throw err;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/onboarding`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
