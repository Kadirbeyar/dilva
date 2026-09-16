import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";

/**
 * Lets an already-signed-in user change their own password from
 * Settings — different from /api/auth/forgot-password, which is for
 * someone who's locked out with no session at all. Requires the
 * CURRENT password (verified via signInWithPassword against the
 * account's own email) before accepting a new one: without that
 * check, anyone who got hold of an already-unlocked device/session
 * could silently lock the real owner out.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { currentPassword, newPassword } = await request.json().catch(() => ({}));

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: "password_too_short" }, { status: 400 });
    }
    if (!user.email) {
      // A pre-migration or otherwise email-less account — nothing to
      // verify the current password against.
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    // Rate-limited by user id rather than IP: this guards one
    // account's own change-password form against repeated wrong
    // current-password guesses, regardless of which network the
    // attempt comes from.
    try {
      await enforceRateLimit(`change_password:${user.id}`, 8, 900);
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      return NextResponse.json({ error: "wrong_password" }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      console.error("[account/change-password] updateUser failed", updateError);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[account/change-password]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
