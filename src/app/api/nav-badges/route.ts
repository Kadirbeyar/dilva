import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

/**
 * Small numbers the NavBar / BottomTabBar show on the Chat and
 * Visitors links (see NavBadgeProvider). Deliberately its own tiny
 * endpoint rather than piggybacking on /api/notifications:
 *
 * - Unread messages come from Message.isRead, the same field
 *   /api/conversations/[id]/read already flips to true when a
 *   conversation is opened — so the chat badge clears itself the
 *   moment you actually read the messages, with no separate
 *   "mark read" step to remember.
 * - Unread visitors come from the PROFILE_VISIT Notification rows
 *   (there's no per-visit "seen" flag on ProfileVisit itself) —
 *   /api/visitors marks those read as soon as the Visitors page is
 *   opened, so this badge clears the same way.
 */
export async function GET() {
  try {
    const user = await requireUser();

    const memberships = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      select: { conversationId: true },
    });
    const conversationIds = memberships.map((m: (typeof memberships)[number]) => m.conversationId);

    const unreadMessages = conversationIds.length
      ? await prisma.message.count({
          where: { conversationId: { in: conversationIds }, senderId: { not: user.id }, isRead: false },
        })
      : 0;

    const unreadVisitors = await prisma.notification.count({
      where: { userId: user.id, type: "PROFILE_VISIT", isRead: false },
    });

    return NextResponse.json({ unreadMessages, unreadVisitors });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[nav-badges]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
