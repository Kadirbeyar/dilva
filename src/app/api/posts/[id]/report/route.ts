import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const REASONS = ["SEXUAL_CONTENT", "SPAM", "HARASSMENT", "OTHER"] as const;

const schema = z.object({
  reason: z.enum(REASONS),
  details: z.string().max(500).optional(),
});

/**
 * Reports a post for admin review — see /admin's "Reported posts"
 * queue. Kept deliberately simple (no automated takedown): a report
 * just flags the post as OPEN; an admin removes it from /admin. One
 * open report per (reporter, post) — re-reporting the same post just
 * no-ops instead of piling up duplicates.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: postId } = await params;
    const body = schema.parse(await req.json());

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (!post) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const existing = await prisma.report.findFirst({
      where: { postId, reporterId: user.id, status: "OPEN" },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadyReported: true });
    }

    await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: post.authorId,
        postId,
        reason: body.reason,
        details: body.details,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[posts/[id]/report]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
