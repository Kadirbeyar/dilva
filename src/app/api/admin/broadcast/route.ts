import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";
import { DILVA_TEAM_USER_ID } from "@/lib/systemAccounts";

const schema = z.object({ message: z.string().min(1).max(2000) });

/** Recipient count for the confirm step in BroadcastForm. */
export async function GET() {
  try {
    await requireAdmin();
    const count = await prisma.user.count({ where: { id: { not: DILVA_TEAM_USER_ID } } });
    return NextResponse.json({ count });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/broadcast:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/**
 * Admin-only: sends one message to every user's chat inbox, from the
 * "Dilva Team" system account (see lib/systemAccounts.ts) — a one-click
 * broadcast (e.g. "we fixed X", "new feature: Y") that shows up in
 * Chat exactly like a normal DM, complete with the unread badge and
 * bell notification, because it IS a normal Message/Notification row;
 * nothing downstream needs to know it was sent in bulk.
 *
 * Every step below is ONE query regardless of how many users exist
 * (never a per-user loop) — Dilva's DB connection goes through
 * Supabase's pooler with connection_limit=1, and Vercel's serverless
 * functions have a hard time limit, so N sequential round-trips for N
 * users would both queue up behind that single connection and risk
 * timing the whole request out once the user base grows.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { message } = schema.parse(await req.json());

    const recipients = await prisma.user.findMany({
      where: { id: { not: DILVA_TEAM_USER_ID } },
      select: { id: true },
    });

    // Reuse the Dilva Team ↔ user conversation if one already exists
    // (e.g. from a previous broadcast, or the user messaged the team
    // directly) instead of creating a second thread with them.
    const teamMemberships = await prisma.conversationParticipant.findMany({
      where: { userId: DILVA_TEAM_USER_ID },
      select: { conversationId: true },
    });
    const teamConvoIds = teamMemberships.map(
      (m: (typeof teamMemberships)[number]) => m.conversationId
    );
    const existingOtherSide = teamConvoIds.length
      ? await prisma.conversationParticipant.findMany({
          where: { conversationId: { in: teamConvoIds }, userId: { not: DILVA_TEAM_USER_ID } },
          select: { conversationId: true, userId: true },
        })
      : [];
    const conversationIdByUser = new Map(
      existingOtherSide.map((p: (typeof existingOtherSide)[number]) => [p.userId, p.conversationId])
    );

    // For anyone without an existing thread, mint the conversation +
    // both participant rows ourselves (ids generated here, not by the
    // DB) so we can bulk-insert everything in exactly one createMany
    // call each — no RETURNING, no per-row round trip.
    const usersNeedingConvo = recipients.filter(
      (u: (typeof recipients)[number]) => !conversationIdByUser.has(u.id)
    );
    if (usersNeedingConvo.length > 0) {
      const minted = usersNeedingConvo.map((u: (typeof usersNeedingConvo)[number]) => ({
        conversationId: randomUUID(),
        userId: u.id,
      }));

      await prisma.conversation.createMany({
        data: minted.map((m: (typeof minted)[number]) => ({ id: m.conversationId, isGroup: false })),
      });
      await prisma.conversationParticipant.createMany({
        data: minted.flatMap((m: (typeof minted)[number]) => [
          { conversationId: m.conversationId, userId: DILVA_TEAM_USER_ID },
          { conversationId: m.conversationId, userId: m.userId },
        ]),
      });
      for (const m of minted) conversationIdByUser.set(m.userId, m.conversationId);
    }

    await prisma.message.createMany({
      data: recipients.map((u: (typeof recipients)[number]) => ({
        conversationId: conversationIdByUser.get(u.id)!,
        senderId: DILVA_TEAM_USER_ID,
        type: "TEXT" as const,
        content: message,
        isRead: false,
      })),
    });

    await prisma.notification.createMany({
      data: recipients.map((u: (typeof recipients)[number]) => ({
        userId: u.id,
        type: "NEW_MESSAGE" as const,
        data: { fromUserId: DILVA_TEAM_USER_ID, broadcast: true },
      })),
    });

    // Bump every affected conversation's updatedAt so the broadcast
    // floats to the top of each recipient's chat list, same as any
    // fresh message would — otherwise an old, buried thread with the
    // team wouldn't visibly move even though it just got a new message.
    await prisma.conversation.updateMany({
      where: { id: { in: [...conversationIdByUser.values()] } },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ sent: recipients.length });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[admin/broadcast]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
