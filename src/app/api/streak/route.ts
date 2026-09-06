import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getActivityStreak } from "@/lib/streak";

export async function GET() {
  try {
    const user = await requireUser();
    const streak = await getActivityStreak(user.id);
    return NextResponse.json(streak);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[streak]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
