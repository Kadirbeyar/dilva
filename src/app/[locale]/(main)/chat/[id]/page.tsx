import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeIsOnline } from "@/lib/presence";
import ChatWindow from "@/components/chat/ChatWindow";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  });
  if (!membership) notFound();
  const isMuted = Boolean(membership.isMuted);

  // Sequential, not Promise.all: connection_limit=1 on the pooled DB
  // connection means firing this alongside the membership check above
  // risks a pool-timeout instead of actually parallelizing.
  const otherParticipant = await prisma.conversationParticipant.findFirst({
    where: { conversationId: id, userId: { not: user.id } },
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
  });

  const otherUser = otherParticipant
    ? {
        id: otherParticipant.user.id,
        username: otherParticipant.user.username,
        displayName: otherParticipant.user.displayName,
        avatarUrl: otherParticipant.user.avatarUrl,
        isPremiumCached: otherParticipant.user.isPremiumCached,
        isOnline: computeIsOnline(otherParticipant.user),
      }
    : null;

  return (
    <main className="mx-auto flex h-[calc(100dvh-0px)] max-w-2xl flex-col">
      <ChatWindow
        conversationId={id}
        currentUserId={user.id}
        otherUser={otherUser}
        initialMuted={isMuted}
      />
    </main>
  );
}
