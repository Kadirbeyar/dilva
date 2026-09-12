import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

/**
 * The signed-in user's own following list — used by the Voice Room
 * "share with friends" picker (see VoiceRoomView.tsx) to let someone
 * pick who to send a room invite to. Deliberately just `following`,
 * not `followers`: sharing with people whose posts you follow reads
 * as "share with friends", the reverse direction doesn't.
 */
export async function GET() {
  try {
    const user = await requireUser();

    const follows = await prisma.follow.findMany({
      where: { followerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        following: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isPremiumCached: true },
        },
      },
    });

    return NextResponse.json({
      users: follows.map((f: (typeof follows)[number]) => f.following),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[me/following:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
