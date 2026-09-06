import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { isPremiumUser } from "@/lib/premium";

const recordSchema = z.object({ visitedUsername: z.string() });

/**
 * Records that the current user viewed `visitedUsername`'s profile.
 * Call this from the profile page on mount. Self-visits and repeat
 * visits within the same day are deduplicated to keep the list useful.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { visitedUsername } = recordSchema.parse(await req.json());

    const visited = await prisma.user.findUnique({ where: { username: visitedUsername } });
    if (!visited || visited.id === user.id) {
      return NextResponse.json({ recorded: false });
    }

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const alreadyToday = await prisma.profileVisit.findFirst({
      where: { visitorId: user.id, visitedId: visited.id, createdAt: { gte: since } },
    });

    if (!alreadyToday) {
      await prisma.profileVisit.create({
        data: { visitorId: user.id, visitedId: visited.id },
      });
      await prisma.notification.create({
        data: {
          userId: visited.id,
          type: "PROFILE_VISIT",
          data: { visitorId: user.id },
        },
      });
    }

    return NextResponse.json({ recorded: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[visitors:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/**
 * Free users: only the COUNT of recent visitors.
 * Premium users: the full, identified list (HelloTalk-style "who
 * viewed my profile" paywall).
 */
export async function GET() {
  try {
    const user = await requireUser();
    const premium = await isPremiumUser(user.id);

    const count = await prisma.profileVisit.count({ where: { visitedId: user.id } });

    // Opening this page is what "reading" your visitors means, same
    // as opening a conversation marks its messages read — clears the
    // "سەردانکەران" nav badge (see /api/nav-badges) without a
    // separate mark-read action to remember.
    await prisma.notification.updateMany({
      where: { userId: user.id, type: "PROFILE_VISIT", isRead: false },
      data: { isRead: true },
    });

    if (!premium) {
      return NextResponse.json({ premium: false, count, visitors: [] });
    }

    const visits = await prisma.profileVisit.findMany({
      where: { visitedId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        visitor: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({
      premium: true,
      count,
      visitors: visits.map((v: (typeof visits)[number]) => ({ ...v.visitor, visitedAt: v.createdAt })),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[visitors:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
