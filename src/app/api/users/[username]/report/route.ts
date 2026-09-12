import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";

const REASONS = ["SEXUAL_CONTENT", "SPAM", "HARASSMENT", "OTHER"] as const;

const schema = z.object({
  reason: z.enum(REASONS),
  details: z.string().max(500).optional(),
});

/**
 * Reports an account directly — same Report model/admin queue as
 * /api/posts/[id]/report, just without a postId (an account-level
 * report rather than one about a specific post). This is what backs
 * the in-room "report" action in Voice Rooms (see VoiceRoomView.tsx):
 * there's no post to attach a report to there, only a person's
 * behavior during the call, so this generic-by-username route is what
 * that UI calls. Kept separate from /block — blocking silences someone
 * for the reporter only and is self-service; this just flags the
 * account for an admin to look at, same as reporting a post does.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await requireUser();
    // Same shape/limit as post reports — a moderation signal, not a
    // public counter, so it needs the same flood protection.
    await enforceRateLimit(`user_report:${user.id}`, 15, 3600);
    const { username } = await params;
    const body = schema.parse(await req.json());

    const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (target.id === user.id) {
      return NextResponse.json({ error: "cannot_report_self" }, { status: 400 });
    }

    const existing = await prisma.report.findFirst({
      where: { reportedUserId: target.id, reporterId: user.id, postId: null, status: "OPEN" },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadyReported: true });
    }

    await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: target.id,
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
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSeconds: err.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
      );
    }
    console.error("[users/[username]/report]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
