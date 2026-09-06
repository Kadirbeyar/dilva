import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({ otherUserId: z.string().uuid() });

/** The fixed greeting a "Wave" sends — kept distinct from ordinary
 *  chat content so we can recognize/rate-limit it without a schema
 *  change (see WAVE_COOLDOWN_MS below). */
const WAVE_CONTENT = "👋";
const WAVE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * HelloTalk-style "Wave" — a single tap sends a friendly 👋 to
 * someone without opening the full chat composer. Finds (or
 * creates) the 1:1 conversation and drops the wave message straight
 * in, same as a normal message (so it triggers the usual NEW_MESSAGE
 * notification and shows up live via Realtime). Rate-limited to one
 * wave per pair per day so it can't be used to spam.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { otherUserId } = schema.parse(await req.json());

    if (otherUserId === user.id) {
      return NextResponse.json({ error: "cannot_wave_self" }, { status: 400 });
    }

    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: user.id },
        ],
      },
    });
    if (isBlocked) {
      return NextResponse.json({ error: "blocked" }, { status: 403 });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: { create: [{ userId: user.id }, { userId: otherUserId }] },
        },
      });
    } else {
      const recentWave = await prisma.message.findFirst({
        where: {
          conversationId: conversation.id,
          senderId: user.id,
          content: WAVE_CONTENT,
          createdAt: { gte: new Date(Date.now() - WAVE_COOLDOWN_MS) },
        },
      });
      if (recentWave) {
        return NextResponse.json(
          { error: "already_waved", conversationId: conversation.id },
          { status: 429 }
        );
      }
    }

    const message = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.message.create({
        data: { conversationId: conversation!.id, senderId: user.id, type: "TEXT", content: WAVE_CONTENT },
      });
      await tx.conversation.update({ where: { id: conversation!.id }, data: { updatedAt: new Date() } });
      return created;
    });

    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: "NEW_MESSAGE",
        data: { conversationId: conversation.id, messageId: message.id, fromUserId: user.id, wave: true },
      },
    });

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[conversations/wave]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
