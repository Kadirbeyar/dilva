import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

async function assertParticipant(conversationId: string, userId: string) {
  const membership = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new AuthError("Not a participant");
  return membership;
}

/**
 * Read receipts. GET is a lightweight poll ChatWindow uses to learn
 * when the other participant(s) have caught up (no Realtime table
 * needed for this one — polling is cheap and avoids one more manual
 * "enable realtime on this table" step). POST marks the current
 * user's own read position.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: conversationId } = await params;
    await assertParticipant(conversationId, user.id);

    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true, lastReadAt: true },
    });

    return NextResponse.json({ participants });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[conversations/read:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: conversationId } = await params;
    const membership = await assertParticipant(conversationId, user.id);

    const now = new Date();
    await prisma.$transaction([
      prisma.conversationParticipant.update({
        where: { id: membership.id },
        data: { lastReadAt: now },
      }),
      prisma.message.updateMany({
        where: { conversationId, senderId: { not: user.id }, isRead: false },
        data: { isRead: true },
      }),
    ]);

    return NextResponse.json({ ok: true, lastReadAt: now });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[conversations/read:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
