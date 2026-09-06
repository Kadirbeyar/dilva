import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { computeIsOnline } from "@/lib/presence";

/** Lists the current user's conversations, most recently active first. */
export async function GET() {
  try {
    const user = await requireUser();

    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isOnline: true,
                lastSeenAt: true,
                isPremiumCached: true,
              },
            },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({
      conversations: conversations.map((c: (typeof conversations)[number]) => ({
        id: c.id,
        isGroup: c.isGroup,
        title: c.title,
        otherParticipants: c.participants
          .filter((p: (typeof c.participants)[number]) => p.userId !== user.id)
          .map((p: (typeof c.participants)[number]) => ({ ...p.user, isOnline: computeIsOnline(p.user) })),
        lastMessage: c.messages[0] ?? null,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[conversations]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
