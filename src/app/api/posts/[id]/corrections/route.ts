import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({
  originalText: z.string().min(1).max(2000),
  correctedText: z.string().min(1).max(2000),
  note: z.string().max(500).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const corrections = await prisma.correction.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
  return NextResponse.json({ corrections });
}

/** Native speakers (or any member) suggest a corrected version of the post text. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: postId } = await params;
    const body = schema.parse(await req.json());

    const correction = await prisma.correction.create({
      data: { postId, authorId: user.id, ...body },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Notify the post author.
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post && post.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "NEW_CORRECTION",
          data: { postId, correctionId: correction.id, fromUserId: user.id },
        },
      });
    }

    return NextResponse.json({ correction }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[posts/corrections]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
