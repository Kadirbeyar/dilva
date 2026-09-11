import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VoiceRoomView from "@/components/voiceRooms/VoiceRoomView";

export default async function VoiceRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const room = await prisma.voiceRoom.findUnique({
    where: { id },
    include: {
      host: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isPremiumCached: true },
      },
    },
  });
  if (!room) notFound();

  return (
    <main className="relative mx-auto flex h-[calc(100dvh-0px)] max-w-2xl flex-col px-4 py-6">
      <div className="bg-mesh-vivid" aria-hidden="true" />
      <VoiceRoomView
        room={{
          id: room.id,
          topic: room.topic,
          isActive: room.isActive,
          maxParticipants: room.maxParticipants,
          host: room.host,
        }}
        currentUser={{
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        }}
      />
    </main>
  );
}
