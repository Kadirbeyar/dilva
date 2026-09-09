import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";

const schema = z.object({ content: z.string().min(1).max(1000) });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
  return NextResponse.json({ comments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    // Comments are quicker to fire off than posts, so a slightly
    // higher limit — still enough to block a script hammering one
    // post's comment box.
    await enforceRateLimit(`comment_create:${user.id}`, 20, 600);
    const { id: postId } = await params;
    const { content } = schema.parse(await req.json());

    const comment = await prisma.comment.create({
      data: { postId, authorId: user.id, content },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Notify the post author (not when commenting on your own post).
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post && post.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "NEW_COMMENT",
          data: { postId, commentId: comment.id, fromUserId: user.id },
        },
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
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
    console.error("[posts/comments]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
