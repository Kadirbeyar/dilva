import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

/**
 * Presence heartbeat — called periodically by <PresenceHeartbeat/>
 * (mounted once in the main layout) while a tab is open, and once
 * more (via navigator.sendBeacon, body `{ offline: true }`) when the
 * tab is closing. See lib/presence.ts for why "online" is ultimately
 * defined by lastSeenAt recency rather than trusting isOnline alone.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    let offline = false;
    try {
      const body = await req.json();
      offline = Boolean(body?.offline);
    } catch {
      // No/empty body (the normal heartbeat call) — treat as "online".
    }

    await prisma.user.update({
      where: { id: user.id },
      data: offline
        ? { isOnline: false }
        : { isOnline: true, lastSeenAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[presence]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
