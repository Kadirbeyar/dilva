"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RealtimePresenceState } from "@supabase/supabase-js";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import VerifiedBadge from "@/components/profile/VerifiedBadge";

type RoomHost = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPremiumCached?: boolean;
};

type CurrentUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type RoomMember = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isMuted: boolean;
};

type SignalKind = "offer" | "answer" | "candidate";
type SignalPayload = { from: string; to: string; kind: SignalKind; data: unknown };

type Phase = "idle" | "connecting" | "joined" | "mic-denied" | "room-full" | "ended" | "left";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
// Tuned by ear against a normal speaking voice over a laptop mic, not
// measured against a spec — good enough for "is someone talking right
// now" as a visual hint, not for anything that needs to be precise.
const SPEAKING_THRESHOLD = 14;

/**
 * A small (2-6 person) live-audio room. Audio itself never touches
 * our server — it's peer-to-peer WebRTC directly between browsers
 * (a full mesh: with only a handful of participants this is simpler
 * and cheaper than running a media server/SFU). This component only
 * uses the network for two things: fetching room metadata (done by
 * the server component that renders this) and exchanging WebRTC
 * signaling messages + "who's here" presence over a Supabase Realtime
 * channel named `voice-room:<id>` — no row is ever written to
 * Postgres for who's currently inside a room.
 */
export default function VoiceRoomView({
  room,
  currentUser,
}: {
  room: {
    id: string;
    topic: string;
    isActive: boolean;
    maxParticipants: number;
    host: RoomHost;
  };
  currentUser: CurrentUser;
}) {
  const t = useTranslations("voiceRooms");
  const router = useRouter();
  const supabase = createClient();
  const isHost = room.host.id === currentUser.id;

  const [phase, setPhase] = useState<Phase>(room.isActive ? "idle" : "ended");
  const [members, setMembers] = useState<Record<string, RoomMember>>({});
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());
  const [micMuted, setMicMuted] = useState(false);
  const [endingBusy, setEndingBusy] = useState(false);
  const [, forceRender] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
  const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Record<string, AnalyserNode>>({});
  const rafRef = useRef<number | null>(null);

  function myPresence(isMuted: boolean) {
    return {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      isMuted,
    };
  }

  function sendSignal(to: string, kind: SignalKind, data: unknown) {
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: { from: currentUser.id, to, kind, data } as SignalPayload,
    });
  }

  function attachAnalyser(id: string, stream: MediaStream) {
    if (!audioCtxRef.current) return;
    try {
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analysersRef.current[id] = analyser;
    } catch {
      // Some browsers are picky about re-using a stream that's also
      // playing through an <audio> element — speaking indicator is a
      // nice-to-have, never worth breaking the call over.
    }
  }

  function cleanupPeer(peerId: string) {
    peersRef.current[peerId]?.close();
    delete peersRef.current[peerId];
    delete remoteStreamsRef.current[peerId];
    delete pendingCandidatesRef.current[peerId];
    try {
      analysersRef.current[peerId]?.disconnect();
    } catch {
      // no-op
    }
    delete analysersRef.current[peerId];
    forceRender((v) => v + 1);
  }

  function createPeerConnection(peerId: string): RTCPeerConnection {
    const existing = peersRef.current[peerId];
    if (existing) return existing;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(peerId, "candidate", e.candidate.toJSON());
    };
    pc.ontrack = (e) => {
      remoteStreamsRef.current[peerId] = e.streams[0];
      attachAnalyser(peerId, e.streams[0]);
      forceRender((v) => v + 1);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        cleanupPeer(peerId);
      }
    };
    peersRef.current[peerId] = pc;
    return pc;
  }

  async function flushPendingCandidates(peerId: string, pc: RTCPeerConnection) {
    const pending = pendingCandidatesRef.current[peerId] ?? [];
    pendingCandidatesRef.current[peerId] = [];
    for (const c of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        // ignore — a stale/duplicate candidate is harmless to drop
      }
    }
  }

  async function initiateOffer(peerId: string) {
    const pc = createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(peerId, "offer", offer);
  }

  async function handleSignal(payload: SignalPayload) {
    if (payload.to !== currentUser.id) return;
    const { from, kind, data } = payload;

    if (kind === "offer") {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
      await flushPendingCandidates(from, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(from, "answer", answer);
    } else if (kind === "answer") {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
        await flushPendingCandidates(from, pc);
      }
    } else if (kind === "candidate") {
      const pc = peersRef.current[from];
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data as RTCIceCandidateInit));
        } catch {
          // ignore
        }
      } else {
        pendingCandidatesRef.current[from] = [
          ...(pendingCandidatesRef.current[from] ?? []),
          data as RTCIceCandidateInit,
        ];
      }
    }
  }

  function syncMembers() {
    const state = channelRef.current?.presenceState() as
      | RealtimePresenceState<RoomMember>
      | undefined;
    if (!state) return;
    const next: Record<string, RoomMember> = {};
    for (const [key, presences] of Object.entries(state)) {
      const p = presences[presences.length - 1];
      if (p) {
        next[key] = {
          id: p.id,
          username: p.username,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          isMuted: !!p.isMuted,
        };
      }
    }
    setMembers(next);
  }

  function teardown() {
    Object.keys(peersRef.current).forEach((id) => cleanupPeer(id));
    localStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    localStreamRef.current = null;
    if (channelRef.current) {
      channelRef.current.untrack().catch(() => {});
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analysersRef.current = {};
    setMembers({});
  }

  async function joinRoom() {
    setPhase("connecting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPhase("mic-denied");
      return;
    }
    localStreamRef.current = stream;
    audioCtxRef.current = new AudioContext();
    attachAnalyser(currentUser.id, stream);

    const channel = supabase.channel(`voice-room:${room.id}`, {
      config: { presence: { key: currentUser.id, enabled: true } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "signal" }, ({ payload }: { payload: SignalPayload }) => {
        void handleSignal(payload);
      })
      .on("broadcast", { event: "room-ended" }, () => {
        teardown();
        setPhase("ended");
      })
      .on("presence", { event: "sync" }, () => {
        syncMembers();
      })
      .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
        if (key !== currentUser.id) cleanupPeer(key);
      })
      .subscribe(async (status: string) => {
        if (status !== "SUBSCRIBED") return;

        const existing = channel.presenceState<RoomMember>();
        const existingKeys = Object.keys(existing).filter((k) => k !== currentUser.id);

        if (existingKeys.length >= room.maxParticipants) {
          setPhase("room-full");
          stream.getTracks().forEach((tr) => tr.stop());
          localStreamRef.current = null;
          supabase.removeChannel(channel);
          channelRef.current = null;
          return;
        }

        await channel.track(myPresence(false));
        setPhase("joined");

        for (const peerId of existingKeys) {
          void initiateOffer(peerId);
        }
      });
  }

  function leaveRoom() {
    teardown();
    setPhase("left");
    router.push("/voice-rooms");
  }

  function toggleMic() {
    const next = !micMuted;
    setMicMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((tr) => {
      tr.enabled = !next;
    });
    channelRef.current?.track(myPresence(next)).catch(() => {});
  }

  async function endRoomForEveryone() {
    setEndingBusy(true);
    const res = await fetch(`/api/voice-rooms/${room.id}/end`, { method: "POST" });
    setEndingBusy(false);
    if (res.ok) {
      channelRef.current?.send({ type: "broadcast", event: "room-ended", payload: {} });
      teardown();
      setPhase("ended");
    }
  }

  // Speaking indicator — one shared rAF loop sampling every attached
  // analyser (local mic + each connected remote stream) while joined.
  useEffect(() => {
    if (phase !== "joined") return;
    let raf = 0;
    const data = new Uint8Array(128);
    function tick() {
      const speaking = new Set<string>();
      for (const [id, analyser] of Object.entries(analysersRef.current)) {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        if (sum / data.length > SPEAKING_THRESHOLD) speaking.add(id);
      }
      setSpeakingIds((prev) => {
        if (prev.size === speaking.size && [...prev].every((id) => speaking.has(id))) return prev;
        return speaking;
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    rafRef.current = raf;
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Tear everything down if the user navigates away mid-call.
  useEffect(() => {
    return () => {
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memberList = Object.values(members);
  const remoteEntries = Object.entries(remoteStreamsRef.current);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-black/5 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-gray-900/80">
      {/* Hidden audio sinks for every connected remote peer. */}
      {remoteEntries.map(([id, stream]) => (
        <audio
          key={id}
          autoPlay
          playsInline
          className="hidden"
          ref={(el) => {
            if (el && el.srcObject !== stream) el.srcObject = stream;
          }}
        />
      ))}

      <div className="flex items-center justify-between gap-3 border-b border-black/5 p-4 dark:border-white/10">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
            </span>
            {t("live")}
          </p>
          <h1 className="truncate text-lg font-bold">{room.topic}</h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {t("hostedBy", { name: room.host.displayName || room.host.username })}
          </p>
        </div>
        {isHost && phase !== "ended" && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={endingBusy}
            onClick={endRoomForEveryone}
            className="shrink-0 rounded-full bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/40 dark:text-red-400"
          >
            {t("endRoomButton")}
          </motion.button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        {phase === "ended" && (
          <div className="text-center">
            <p className="text-4xl">👋</p>
            <p className="mt-3 font-semibold">{t("roomEnded")}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/voice-rooms")}
              className="mt-4 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              {t("backToList")}
            </motion.button>
          </div>
        )}

        {phase === "room-full" && (
          <div className="text-center">
            <p className="text-4xl">🚪</p>
            <p className="mt-3 font-semibold">{t("roomFull")}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/voice-rooms")}
              className="mt-4 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              {t("backToList")}
            </motion.button>
          </div>
        )}

        {phase === "mic-denied" && (
          <div className="text-center">
            <p className="text-4xl">🎙️</p>
            <p className="mt-3 font-semibold text-red-600 dark:text-red-400">{t("micDenied")}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={joinRoom}
              className="mt-4 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              {t("tryAgain")}
            </motion.button>
          </div>
        )}

        {(phase === "idle" || phase === "left") && (
          <div className="text-center">
            <p className="text-4xl">🎧</p>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t("joinPrompt")}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={joinRoom}
              className="mt-4 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              {t("joinButton")}
            </motion.button>
          </div>
        )}

        {phase === "connecting" && (
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("connecting")}</p>
          </div>
        )}

        {phase === "joined" && (
          <>
            <div className="grid w-full max-w-md grid-cols-3 gap-4 sm:grid-cols-4">
              <AnimatePresence initial={false}>
                {memberList.map((m) => {
                  const speaking = speakingIds.has(m.id);
                  const isMe = m.id === currentUser.id;
                  const muted = isMe ? micMuted : m.isMuted;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`relative h-16 w-16 overflow-hidden rounded-full bg-gray-200 ring-4 transition dark:bg-gray-700 ${
                          speaking ? "ring-brand-500" : "ring-transparent"
                        }`}
                      >
                        {m.avatarUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" />
                        )}
                        {muted && (
                          <span className="absolute bottom-0 end-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/80 text-[10px] text-white">
                            🔇
                          </span>
                        )}
                        {m.id === room.host.id && (
                          <span className="absolute -top-0.5 -start-0.5 rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                            {t("hostBadge")}
                          </span>
                        )}
                      </div>
                      <p className="max-w-[72px] truncate text-center text-[11px] font-medium">
                        {isMe ? t("you") : m.displayName || m.username}
                        {m.id === room.host.id && <VerifiedBadge size="sm" />}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={toggleMic}
                title={micMuted ? t("unmuteSelf") : t("muteSelf")}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg shadow-sm transition ${
                  micMuted
                    ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                    : "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                }`}
              >
                {micMuted ? "🔇" : "🎙️"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={leaveRoom}
                title={t("leaveButton")}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-lg text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700"
              >
                📴
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
