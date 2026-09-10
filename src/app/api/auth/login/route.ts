import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
