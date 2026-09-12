import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";

const createSchema = z.object({
  topic: z.string().trim().min(3).max(120),
});

// A room whose creator's tab crashed/closed without hitting "End" has
// no reliable way to signal that — there's no server-side heartbeat
// for it (participants are pure Realtime Presence, not DB rows). Any
// room still marked active past this age is treated as dead air and
// hidden from the list rather than left as a ghost entry forever.
const STALE_ROOM_MS = 6 * 60 * 60 * 1000;

/** Lists currently-open Voice Rooms, newest first. */
export async function GET() {
  try {
    await requireUser();

    const rooms = await prisma.voiceRoom.findMany({
      where: {
        isActive: true,
        createdAt: { gte: new Date(Date.now() - STALE_ROOM_MS) },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        host: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isPremiumCached: true },
        },
      },
    });

    return NextResponse.json({ rooms });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[voice-rooms:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Creates a new Voice Room. The creator becomes its host. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    // 5 rooms/hour per account — plenty for normal use, enough to stop
    // someone from spamming the list with junk rooms.
    await enforceRateLimit(`voice_room_create:${user.id}`, 5, 3600);

    const body = createSchema.parse(await req.json());

    const room = await prisma.voiceRoom.create({
      data: { topic: body.topic, hostId: user.id },
      include: {
        host: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isPremiumCached: true },
        },
      },
    });

    // Invite everyone who follows the host in — a notification per
    // follower. Sequential with the create above (not Promise.all): the
    // DB connection has connection_limit=1, so parallel awaits just
    // queue anyway. Best-effort: a failure here shouldn't fail room
    // creation, the room already exists and is usable either way.
    try {
      const followers = await prisma.follow.findMany({
        where: { followingId: user.id },
        select: { followerId: true },
      });
      if (followers.length > 0) {
        await prisma.notification.createMany({
          data: followers.map((f: { followerId: string }) => ({
            userId: f.followerId,
            type: "VOICE_ROOM_STARTED",
            data: { fromUserId: user.id, roomId: room.id, topic: room.topic },
          })),
        });
      }
    } catch (notifyErr) {
      console.error("[voice-rooms:POST] follower notify failed", notifyErr);
    }

    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSeconds: err.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[voice-rooms:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
