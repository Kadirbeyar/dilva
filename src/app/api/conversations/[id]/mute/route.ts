import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({ muted: z.boolean() });

/**
 * Mutes/unmutes ONE conversation for the current user only — sets
 * isMuted on their own ConversationParticipant row (see
 * prisma/sql/20_chat_mute_and_media.sql). Muting silences the bell
 * notification and push for future messages in this thread (see
 * /api/conversations/[id]/messages) without hiding the conversation,
 * blocking the other person, or affecting what THEY see on their end
 * — the other participant's own row/mute state is untouched.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: conversationId } = await params;
    const { muted } = schema.parse(await req.json());

    const result = await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { isMuted: muted },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ muted });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[conversations/[id]/mute:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
