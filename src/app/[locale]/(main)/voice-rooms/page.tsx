import { getCurrentUser } from "@/lib/auth";
import VoiceRoomsList from "@/components/voiceRooms/VoiceRoomsList";

export default async function VoiceRoomsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <main className="relative mx-auto max-w-2xl px-4 py-8">
      <div className="bg-mesh" aria-hidden="true" />
      <VoiceRoomsList />
    </main>
  );
}
