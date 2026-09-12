import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().email(), origin: z.string().url() });

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

/**
 * Sends a password-reset email via Supabase Auth. Deliberately always
 * responds the same way whether or not the email belongs to an
 * account — Supabase itself doesn't reveal that either, and the UI
 * (ForgotPasswordPage) shows one "check your email" message regardless,
 * so a scraper can't use this to find out which emails have accounts.
 */
export async function POST(req: Request) {
  try {
    const { email, origin } = schema.parse(await req.json());
    // By IP, not by email — the whole point is that a wrong/unregistered
    // email must behave identically to a real one, including timing.
    await enforceRateLimit(`forgot_password:${clientIp(req)}`, 5, 900);

    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSeconds: err.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[auth/forgot-password]", err);
    // Same reasoning as above: never let a server-side hiccup make this
    // behave differently from the happy path.
    return NextResponse.json({ ok: true });
  }
}
