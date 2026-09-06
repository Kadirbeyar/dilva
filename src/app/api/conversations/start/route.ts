import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({ otherUserId: z.string().uuid() });

/**
 * Finds (or creates) the 1:1 conversation between the current user
 * and `otherUserId`. Used by "Say hi" on the matching page and
 * "Message" on a profile.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { otherUserId } = schema.parse(await req.json());

    if (otherUserId === user.id) {
      return NextResponse.json({ error: "cannot_message_self" }, { status: 400 });
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

    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ conversationId: existing.id });
    }

    const created = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: user.id }, { userId: otherUserId }],
        },
      },
    });

    return NextResponse.json({ conversationId: created.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[conversations/start]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
