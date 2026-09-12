import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";
import { sendPushToUser } from "@/lib/webpush";
import { DILVA_TEAM_USER_ID } from "@/lib/systemAccounts";

const sendSchema = z.object({
  content: z.string().min(1).max(4000),
  originalLanguageCode: z.string().optional(),
  type: z.enum(["TEXT", "IMAGE", "AUDIO"]).optional(),
  mediaUrl: z.string().url().optional(),
});

/**
 * Confirms `userId` is a participant, and in the same round trip
 * reports whether "Dilva Team" (see lib/systemAccounts.ts) is the
 * other side of this conversation — the broadcast sender has nobody
 * reading replies, so POST below refuses to let anyone actually send
 * one into that thread (the chat UI already hides the composer for
 * it; this is the server-side half of that, since a hidden button is
 * not the same as an enforced rule).
 */
async function assertParticipant(conversationId: string, userId: string) {
  const memberships = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { in: [userId, DILVA_TEAM_USER_ID] } },
    select: { userId: true },
  });
  const ids = memberships.map((m: (typeof memberships)[number]) => m.userId);
  if (!ids.includes(userId)) throw new AuthError("Not a participant");
  return { isSystemConversation: userId !== DILVA_TEAM_USER_ID && ids.includes(DILVA_TEAM_USER_ID) };
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
    const { isSystemConversation } = await assertParticipant(conversationId, user.id);
    if (isSystemConversation) {
      return NextResponse.json({ error: "system_conversation" }, { status: 403 });
    }

    // /api/conversations/start already refuses to create a NEW
    // conversation between two people with a block between them — but
    // a block made AFTER a conversation already exists needs its own
    // check here, otherwise the blocked side could keep sending into
    // that older thread indefinitely. Conversations in this app are
    // 1-1, so "the other participant" is just whoever isn't us.
    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: { not: user.id } },
      select: { userId: true },
    });
    if (otherParticipant) {
      const blocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: user.id, blockedId: otherParticipant.userId },
            { blockerId: otherParticipant.userId, blockedId: user.id },
          ],
        },
      });
      if (blocked) {
        return NextResponse.json({ error: "blocked" }, { status: 403 });
      }
    }

    // 60 messages/minute per account is well above real typing speed
    // (even fast back-and-forth chat) but stops a script from
    // spamming a conversation or hammering Supabase Realtime.
    await enforceRateLimit(`message_send:${user.id}`, 60, 60);

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

    // Notify the other participant(s) in the conversation — except
    // anyone who has muted this conversation (see isMuted on
    // ConversationParticipant / /api/conversations/[id]/mute): the
    // message row above is created either way, so a muted recipient
    // still sees it the moment they open the chat, they just don't
    // get a bell notification or a push for it.
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: user.id } },
      select: { userId: true, isMuted: true },
    });
    const notifyTargets = otherParticipants.filter(
      (p: (typeof otherParticipants)[number]) => !p.isMuted
    );
    if (notifyTargets.length > 0) {
      await prisma.notification.createMany({
        data: notifyTargets.map((p: (typeof notifyTargets)[number]) => ({
          userId: p.userId,
          type: "NEW_MESSAGE" as const,
          data: { conversationId, messageId: message.id, fromUserId: user.id },
        })),
      });

      // Best-effort push (no-op if VAPID isn't configured — see
      // lib/webpush.ts) so a chat message reaches someone even when
      // Dilva isn't open in a tab. Never allowed to fail the send
      // itself — the message and in-app notification above are
      // already saved either way.
      // Sequential, not Promise.all — same connection_limit=1 reason
      // as everywhere else here; each sendPushToUser call does its own
      // DB read for that recipient's subscriptions. Conversations are
      // 1-1 in this app today, so in practice this is a single call.
      const senderName = user.displayName || user.username;
      try {
        for (const p of notifyTargets as { userId: string }[]) {
          await sendPushToUser(p.userId, {
            title: senderName,
            body: body.type === "TEXT" ? body.content : "📎 Sent an attachment",
            url: `/chat/${conversationId}`,
          });
        }
      } catch (pushErr) {
        console.error("[messages:POST] push", pushErr);
      }
    }

    return NextResponse.json({ message }, { status: 201 });
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
    console.error("[messages:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
