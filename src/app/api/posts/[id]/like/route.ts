import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";

/** Toggle a like on a post. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    // Loose limit — normal use never gets close to this — just closes
    // off a scripted like/unlike loop, which would otherwise spam the
    // post author with a NEW_LIKE notification on every toggle.
    await enforceRateLimit(`post_like:${user.id}`, 120, 600);
    const { id: postId } = await params;

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.like.create({ data: { postId, userId: user.id } });

    // Notify the post author (not when liking your own post).
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post && post.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "NEW_LIKE",
          data: { postId, fromUserId: user.id },
        },
      });
    }

    return NextResponse.json({ liked: true });
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
    console.error("[posts/like]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
