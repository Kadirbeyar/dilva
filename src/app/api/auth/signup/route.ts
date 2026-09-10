import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
