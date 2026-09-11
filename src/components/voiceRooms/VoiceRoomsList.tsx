"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import VerifiedBadge from "@/components/profile/VerifiedBadge";

type RoomListItem = {
  id: string;
  topic: string;
  createdAt: string;
  maxParticipants: number;
  host: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isPremiumCached: boolean;
  };
};

/**
 * Browse + create small live-audio "Voice Rooms". Doesn't show a live
 * headcount per room in this list (that would mean subscribing to
 * every room's Realtime presence channel just to render the list) —
 * the actual "who's talking right now" view only exists once you've
 * joined a specific room, see VoiceRoomView.
 */
export default function VoiceRoomsList() {
  const t = useTranslations("voiceRooms");
  const router = useRouter();

  const [rooms, setRooms] = useState<RoomListItem[] | null>(null);
  const [topic, setTopic] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadRooms() {
    fetch("/api/voice-rooms")
      .then((r) => r.json())
      .then((d) => setRooms(d.rooms ?? []))
      .catch(() => setRooms([]));
  }

  useEffect(() => {
    loadRooms();
  }, []);

  async function createRoom() {
    const trimmed = topic.trim();
    if (trimmed.length < 3) {
      setError(t("topicError"));
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/voice-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed }),
      });
      if (res.ok) {
        const { room } = await res.json();
        router.push(`/voice-rooms/${room.id}` as any);
      } else {
        setError(t("createError"));
      }
    } catch {
      setError(t("createError"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold"
      >
        {t("title")}
      </motion.h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>

      <div className="card-shadow mt-5 rounded-2xl bg-white p-3 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createRoom()}
            placeholder={t("topicPlaceholder")}
            maxLength={120}
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={createRoom}
            disabled={creating || topic.trim().length < 3}
            className="shrink-0 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-40"
          >
            {creating ? "…" : t("createButton")}
          </motion.button>
        </div>
        {error && <p className="mt-1.5 px-1 text-xs text-red-600">{error}</p>}
      </div>

      {!rooms ? (
        <p className="mt-6 text-gray-500 dark:text-gray-400">…</p>
      ) : rooms.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">{t("noRooms")}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {rooms.map((room, i) => (
              <motion.li
                key={room.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <button
                  onClick={() => router.push(`/voice-rooms/${room.id}` as any)}
                  className="card-shadow flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-start transition hover:bg-brand-50/40 dark:bg-gray-800 dark:hover:bg-brand-900/10"
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    {room.host.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={room.host.avatarUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{room.topic}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {t("hostedBy", { name: room.host.displayName || room.host.username })}
                      {room.host.isPremiumCached && <VerifiedBadge size="sm" />}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-600" />
                    </span>
                    {t("live")}
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}
