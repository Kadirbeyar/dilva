import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

/** Toggle following the given username (by the signed-in user). */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await requireUser();
    const { username } = await params;

    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (target.id === user.id) {
      return NextResponse.json({ error: "cannot_follow_self" }, { status: 400 });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
    } else {
      await prisma.follow.create({
        data: { followerId: user.id, followingId: target.id },
      });
      await prisma.notification.create({
        data: {
          userId: target.id,
          type: "NEW_FOLLOWER",
          data: { fromUserId: user.id },
        },
      });
    }

    const followerCount = await prisma.follow.count({ where: { followingId: target.id } });

    return NextResponse.json({ following: !existing, followerCount });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[users/follow]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
