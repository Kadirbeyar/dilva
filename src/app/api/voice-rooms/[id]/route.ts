import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

/** Fetches one room's metadata (topic/host/open-or-not) before joining it. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;

    const room = await prisma.voiceRoom.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isPremiumCached: true },
        },
      },
    });
    if (!room) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[voice-rooms/[id]:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
