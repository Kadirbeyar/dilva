import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const sendSchema = z.object({
  content: z.string().min(1).max(4000),
  originalLanguageCode: z.string().optional(),
  type: z.enum(["TEXT", "IMAGE", "AUDIO"]).optional(),
  mediaUrl: z.string().url().optional(),
});

async function assertParticipant(conversationId: string, userId: string) {
  const membership = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new AuthError("Not a participant");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: conversationId } = await params;
    await assertParticipant(conversationId, user.id);

    // Sequential, not Promise.all: Dilva's DB connection goes through
    // Supabase's pooler with connection_limit=1 — firing both at once
    // doesn't parallelize, it just queues them and risks a
    // pool-timeout (P2024). ChatWindow polls this endpoint every few
    // seconds, so a flaky 500 here reads as "messages don't show up."
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: { translations: true },
    });
    // Included so ChatWindow can show "seen" — see also
    // /api/conversations/[id]/read, which is what updates lastReadAt.
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true, lastReadAt: true },
    });

    return NextResponse.json({ messages, participants });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[messages:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/**
 * Sends a message. The row is written straight to Postgres — the
 * chat UI on the other end receives it via Supabase Realtime
 * (postgres_changes on the "messages" table), not through this
 * response. See components/chat/ChatWindow.tsx.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: conversationId } = await params;
    await assertParticipant(conversationId, user.id);

    const body = sendSchema.parse(await req.json());

    const message = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: user.id,
          type: body.type ?? "TEXT",
          content: body.content,
          originalLanguageCode: body.originalLanguageCode,
          mediaUrl: body.mediaUrl,
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return created;
    });

    // Notify the other participant(s) in the conversation.
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: user.id } },
      select: { userId: true },
    });
    if (otherParticipants.length > 0) {
      await prisma.notification.createMany({
        data: otherParticipants.map((p: (typeof otherParticipants)[number]) => ({
          userId: p.userId,
          type: "NEW_MESSAGE" as const,
          data: { conversationId, messageId: message.id, fromUserId: user.id },
        })),
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[messages:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
