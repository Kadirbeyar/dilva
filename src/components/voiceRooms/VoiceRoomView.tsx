"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RealtimePresenceState } from "@supabase/supabase-js";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

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
  /**
   * null = a plain listener (audience) with no mic — the vast
   * majority of a big room. 0 = the host's own reserved center slot.
   * 1..SEAT_COUNT = one of the numbered seats around the host. Seats
   * are how "who can talk" is decided, entirely separate from being
   * counted in the room at all (see the audience count below).
   */
  seat: number | null;
  /**
   * Present only on the HOST's own presence entry — the list of user
   * ids the host has removed from this room. There is no DB row for
   * room membership at all (see the file header below), so this is
   * the only place "removed until the room ends" can live; every
   * client re-checks it against their own id on every presence sync
   * (see syncMembers), which is what makes a removal stick even if
   * the removed person refreshes the page and tries to rejoin.
   */
  banned?: string[];
};

type SignalKind = "offer" | "answer" | "candidate";
type SignalPayload = { from: string; to: string; kind: SignalKind; data: unknown };
type ChatMessage = { id: string; kind: "chat" | "system"; text: string; name?: string };

type Phase = "idle" | "connecting" | "joined" | "mic-denied" | "ended" | "left" | "kicked";

// STUN alone only works when at least one side can be reached with a
// plain public IP:port — many home/mobile ISPs (very much including
// carrier-grade NAT, common on mobile data) sit both sides behind NAT
// that STUN can't punch through, so the two browsers can never agree
// on a direct path and the connection sits at "disconnected" forever
// — no relay, no audio, even though both people show up fine in the
// room (that's Realtime Presence, an entirely separate system from
// the actual audio connection). This fallback list is STUN-only,
// which is why it only reliably works for two devices on the SAME
// network — see /api/voice-rooms/turn-credentials for the real fix
// (a TURN relay), fetched at join time and merged in below.
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
// Tuned by ear against a normal speaking voice over a laptop mic, not
// measured against a spec — good enough for "is someone talking right
// now" as a visual hint, not for anything that needs to be precise.
const SPEAKING_THRESHOLD = 14;

// Eight numbered seats around the host, matching the classic
// "live audio party room" layout (host centered, guests arranged in a
// loose ring around them) — percent-of-container coordinates so the
// ring scales with whatever height the page gives this component,
// rather than fixed pixels tied to one screen size.
const SEAT_COUNT = 8;
const SEAT_LAYOUT: { xPct: number; yPct: number }[] = [
  { xPct: 36, yPct: 26 },
  { xPct: 64, yPct: 26 },
  { xPct: 84, yPct: 43 },
  { xPct: 84, yPct: 62 },
  { xPct: 64, yPct: 78 },
  { xPct: 36, yPct: 78 },
  { xPct: 16, yPct: 62 },
  { xPct: 16, yPct: 43 },
];

const REPORT_REASONS = ["SEXUAL_CONTENT", "SPAM", "HARASSMENT", "OTHER"] as const;
const REPORT_REASON_KEY: Record<(typeof REPORT_REASONS)[number], string> = {
  SEXUAL_CONTENT: "reasonSexual",
  SPAM: "reasonSpam",
  HARASSMENT: "reasonHarassment",
  OTHER: "reasonOther",
};

/**
 * One seat around the ring — the host's own center slot (big, always
 * shows even before they've joined, using the static `room.host` info
 * as a placeholder) or a numbered guest seat (an empty "+" circle
 * until someone taps it). Tapping an EMPTY seat claims it; tapping
 * YOUR OWN occupied seat toggles your mic — there's no separate global
 * mute button, matching how these seats work everywhere else (the
 * seat itself IS the mic control).
 */
function VoiceSeat({
  position,
  seatNumber,
  member,
  isHostSlot = false,
  big = false,
  speaking,
  isMe,
  onTapEmpty,
  seatBusy = false,
  onReport,
  onKick,
  reported = false,
}: {
  position: { xPct: number; yPct: number };
  seatNumber?: number;
  member?: RoomMember;
  isHostSlot?: boolean;
  big?: boolean;
  speaking: boolean;
  isMe: boolean;
  onTapEmpty?: () => void;
  seatBusy?: boolean;
  onReport?: () => void;
  onKick?: () => void;
  reported?: boolean;
}) {
  const t = useTranslations("voiceRooms");
  const tr = useTranslations("report");
  const size = big ? "h-[72px] w-[72px]" : "h-14 w-14";

  function handleTap() {
    if (seatBusy) return;
    if (!member) {
      onTapEmpty?.();
    }
    // Tapping your OWN occupied seat is handled by the mic-toggle
    // button rendered separately below the ring (see the parent) —
    // kept as an explicit button rather than overloading this tap so
    // it's never ambiguous with reporting/removing someone else.
  }

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: `${position.xPct}%`, top: `${position.yPct}%` }}
    >
      <button
        onClick={handleTap}
        disabled={Boolean(member) || seatBusy}
        className={`rounded-full p-[3px] transition-all duration-300 ${
          speaking
            ? "bg-gradient-to-br from-amber-300 via-orange-400 to-pink-500 shadow-lg shadow-orange-500/40"
            : "bg-white/10"
        }`}
      >
        <div className={`relative ${size} overflow-hidden rounded-full bg-white/10 ring-2 ring-white/20`}>
          {member?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : !member ? (
            <span className="flex h-full w-full items-center justify-center text-xl text-white/40">
              {seatBusy ? "…" : "+"}
            </span>
          ) : null}
          {member?.isMuted && (
            <span className="absolute bottom-0 end-0 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px]">
              🔇
            </span>
          )}
          {isHostSlot && (
            <span className="absolute -top-0.5 start-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-1.5 text-[9px] font-bold text-white shadow-sm">
              {t("hostBadge")}
            </span>
          )}
        </div>
      </button>

      <p className="max-w-[68px] truncate text-center text-[11px] font-medium text-white/90">
        {member ? (isMe ? t("you") : member.displayName || member.username) : seatNumber}
      </p>

      {member && !isMe && (onReport || onKick) && (
        <div className="flex items-center gap-2 text-[10px] leading-none">
          {reported ? (
            <span className="text-white/40">{tr("submitted")}</span>
          ) : (
            onReport && (
              <button onClick={onReport} title={t("reportParticipant")} className="text-white/50 transition hover:text-red-300">
                🚩
              </button>
            )
          )}
          {onKick && (
            <button onClick={onKick} title={t("removeParticipant")} className="text-white/50 transition hover:text-red-300">
              ⛔
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A live-audio Voice Room, "party room" style: a host in the center,
 * up to SEAT_COUNT numbered seats around them who can also speak, and
 * an unlimited audience who can listen and chat but never has to hand
 * over microphone access at all. Audio itself never touches our
 * server — it's peer-to-peer WebRTC directly between browsers (full
 * mesh between whoever currently has something to send: the host and
 * seat-holders — see ensureLocalMedia/maybeInitiate below for exactly
 * who connects to whom and why). This component only uses the network
 * for two things: fetching room metadata (done by the server
 * component that renders this) and exchanging WebRTC signaling
 * messages, chat text, and "who's here" presence over a Supabase
 * Realtime channel named `voice-room:<id>` — no row is ever written to
 * Postgres for who's currently inside a room, who's in which seat, or
 * what anyone said in the room's chat.
 *
 * A full mesh scales fine for the SPEAKERS (host + up to 8 seats,
 * the same small-group scale this component always targeted) but a
 * speaker's own connection count still grows with the AUDIENCE size,
 * since each listener needs its own direct connection to hear them —
 * fine for a room of a few dozen listeners on a decent connection,
 * but a room that regularly draws hundreds of concurrent listeners
 * would need a real media relay (SFU) instead of this mesh, which is
 * a bigger infrastructure change than this component can do alone.
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
  const tr = useTranslations("report");
  const router = useRouter();
  const supabase = createClient();
  const isHost = room.host.id === currentUser.id;

  const [phase, setPhase] = useState<Phase>(room.isActive ? "idle" : "ended");
  const [members, setMembers] = useState<Record<string, RoomMember>>({});
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());
  const [micMuted, setMicMuted] = useState(false);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [seatBusySeat, setSeatBusySeat] = useState<number | null>(null);
  const [seatError, setSeatError] = useState<string | null>(null);
  const [endingBusy, setEndingBusy] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [, forceRender] = useState(0);
  const audioElsRef = useRef<Record<string, HTMLAudioElement>>({});

  // In-room moderation: the host removing a disruptive participant
  // (kept out for the rest of this room's life, see the RoomMember
  // "banned" comment above) or muting everyone at once, and any
  // participant flagging one for admin review. All of this acts on
  // the person's presence in THIS room only — none of it touches the
  // account-wide Block relationship (see BlockButton.tsx elsewhere),
  // which is a separate, longer-lived decision a viewer makes from a
  // profile page rather than mid-call.
  const [reportTarget, setReportTarget] = useState<RoomMember | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
  const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Record<string, AnalyserNode>>({});
  const rafRef = useRef<number | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE_SERVERS);

  // Mirrors of state that the Realtime channel's event handlers need
  // to read — those handlers are attached once, inside joinRoom, when
  // the channel is created, so (unlike a plain onClick handler, which
  // is rebuilt fresh every render) they'd otherwise only ever see the
  // state values that existed at that one moment. Every place that
  // updates the matching state below also updates its ref.
  const phaseRef = useRef<Phase>(phase);
  const micMutedRef = useRef(false);
  const mySeatRef = useRef<number | null>(null);
  const membersRef = useRef<Record<string, RoomMember>>({});
  const bannedIdsRef = useRef<Set<string>>(new Set());

  function updatePhase(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }
  function updateMicMuted(m: boolean) {
    micMutedRef.current = m;
    setMicMuted(m);
  }
  function updateMySeat(s: number | null) {
    mySeatRef.current = s;
    setMySeat(s);
  }

  function myPresence(isMuted: boolean, seat: number | null) {
    return {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      isMuted,
      seat,
      ...(isHost ? { banned: Array.from(bannedIdsRef.current) } : {}),
    };
  }

  function sendSignal(to: string, kind: SignalKind, data: unknown) {
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: { from: currentUser.id, to, kind, data } as SignalPayload,
    });
  }

  function pushChatMessage(msg: Omit<ChatMessage, "id">) {
    setChatMessages((prev) => {
      const next = [...prev, { ...msg, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }];
      // Ephemeral and capped — this is a live chat feed, not a
      // record anyone needs to scroll back through later (nothing
      // here is ever written to Postgres, see the file header).
      return next.length > 60 ? next.slice(next.length - 60) : next;
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
    delete audioElsRef.current[peerId];
    try {
      analysersRef.current[peerId]?.disconnect();
    } catch {
      // no-op
    }
    delete analysersRef.current[peerId];
    forceRender((v) => v + 1);
  }

  /**
   * Chrome/Safari can block audio playback that isn't tied closely
   * enough to a user gesture — and a remote WebRTC track normally
   * arrives asynchronously (after a signaling round trip), well after
   * the "Join Room" click that started it. Relying on the `autoPlay`
   * attribute alone silently produced "I joined but hear nothing" for
   * some browsers/first-time visits, so every remote stream also gets
   * an explicit play() call here; if THAT gets rejected too (a
   * NotAllowedError), a visible "enable sound" button appears — a
   * real click on it always satisfies the gesture requirement.
   */
  function playAudioEl(id: string, el: HTMLAudioElement) {
    audioElsRef.current[id] = el;
    el.play().catch(() => setNeedsAudioUnlock(true));
  }

  function unlockAudio() {
    setNeedsAudioUnlock(false);
    Object.values(audioElsRef.current).forEach((el) => {
      el.play().catch(() => setNeedsAudioUnlock(true));
    });
  }

  /**
   * Declares what THIS side of a peer connection can offer: our own
   * mic track if we currently have one (host, or seated), otherwise
   * an explicit receive-only audio slot so we can still hear the
   * other side even though we have nothing to send back. Safe to call
   * more than once on the same connection (e.g. once at creation as a
   * listener, again later after taking a seat) — addTrack no-ops if
   * that exact track is already attached, and the browser upgrades
   * the existing recvonly slot to two-way on its own once we do have
   * something to send.
   */
  function ensureLocalMedia(pc: RTCPeerConnection) {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        const alreadyAdded = pc.getSenders().some((s) => s.track === track);
        if (!alreadyAdded) pc.addTrack(track, stream);
      });
    } else if (pc.getTransceivers().length === 0) {
      pc.addTransceiver("audio", { direction: "recvonly" });
    }
  }

  function createPeerConnection(peerId: string): RTCPeerConnection {
    const existing = peersRef.current[peerId];
    if (existing) return existing;

    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    ensureLocalMedia(pc);
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(peerId, "candidate", e.candidate.toJSON());
    };
    pc.ontrack = (e) => {
      // eslint-disable-next-line no-console
      console.log("[voice-room] ontrack from", peerId, e.streams[0]?.getAudioTracks());
      remoteStreamsRef.current[peerId] = e.streams[0];
      attachAnalyser(peerId, e.streams[0]);
      forceRender((v) => v + 1);
    };
    pc.onconnectionstatechange = () => {
      // eslint-disable-next-line no-console
      console.log("[voice-room] connectionState", peerId, pc.connectionState);
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

  /** Re-negotiates an EXISTING connection after we've gone from
   * listener to speaker (see takeSeat) — adds our now-available track
   * and sends a fresh offer, which the other side's ordinary "offer"
   * handling (below) already knows how to answer even mid-call. */
  async function renegotiate(peerId: string) {
    const pc = peersRef.current[peerId];
    if (!pc) return;
    ensureLocalMedia(pc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(peerId, "offer", offer);
  }

  /** Whether a member currently has (or should have) something to say
   * — the host always does, a numbered-seat holder does, plain
   * audience doesn't. Used to decide who even needs a WebRTC
   * connection to whom (see maybeInitiate) — two audience members
   * never connect to each other, since neither has anything the other
   * could hear. */
  function isSpeaker(m: RoomMember | undefined): boolean {
    if (!m) return false;
    return m.id === room.host.id || m.seat != null;
  }

  /**
   * Decides whether WE should be the one to start a WebRTC connection
   * to `peerId`, using a deterministic tie-breaker (lower user id
   * initiates) instead of "whoever joined more recently" — reading
   * presenceState() right after subscribe() is a race (the initial
   * presence sync is a separate message that can arrive a beat after
   * the SUBSCRIBED callback fires), which was silently leaving BOTH
   * sides waiting for an offer that neither ever sent: presence still
   * showed everyone correctly (that only needs the "sync" event,
   * unrelated to WebRTC), but no audio ever negotiated. Calling this
   * from every "join"/"sync" presence event, on both sides, and
   * guarding against re-initiating an already-open connection, makes
   * it self-healing regardless of event ordering — including the
   * case where neither side was a speaker yet when they first saw
   * each other, and one of them takes a seat later (see takeSeat,
   * which re-runs this for everyone already in the room).
   */
  function maybeInitiate(peerId: string) {
    if (peerId === currentUser.id) return;
    if (peersRef.current[peerId]) return;
    const amSpeaker = isHost || mySeatRef.current != null;
    const peerSpeaks = isSpeaker(membersRef.current[peerId]);
    if (!amSpeaker && !peerSpeaks) return; // neither side has anything to send or hear
    if (currentUser.id < peerId) {
      void initiateOffer(peerId);
    }
    // else: the other side's id sorts lower — they're the one who
    // will send us an offer; we just answer it in handleSignal.
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
          seat: p.seat ?? null,
          banned: p.banned,
        };
      }
    }
    setMembers(next);
    membersRef.current = next;

    // Session-scoped moderation: the host carries their own "removed
    // this session" list inside their OWN presence payload (see
    // myPresence/kickMember) rather than a database row — consistent
    // with this room having no DB-backed membership at all. Every
    // client checks it on every sync, so even someone who refreshes
    // the page and rejoins gets caught again the moment they see the
    // host's current presence, without depending on the host still
    // being around to re-send a one-off "kick" broadcast at that
    // exact second.
    const host = next[room.host.id];
    if (host?.banned?.includes(currentUser.id) && phaseRef.current !== "kicked") {
      teardown();
      updatePhase("kicked");
      return;
    }

    // Backstop: also (re-)evaluate connections for everyone currently
    // present, in case a "join" event was ever missed (e.g. right
    // after a reconnect) or someone's speaker status just changed
    // (e.g. they took a seat) — maybeInitiate no-ops for peers we're
    // already connected to, or who still have nothing to send/hear.
    Object.keys(next).forEach((key) => maybeInitiate(key));
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
    membersRef.current = {};
    updateMySeat(null);
    setChatMessages([]);
  }

  async function joinRoom() {
    updatePhase("connecting");

    // Only the host is required to be a speaker from the moment they
    // open the room — everyone else joins as a silent listener first
    // (no microphone permission prompt at all) and only becomes a
    // speaker if/when they tap an empty seat (see takeSeat).
    if (isHost) {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        updatePhase("mic-denied");
        return;
      }
      localStreamRef.current = stream;
      audioCtxRef.current = new AudioContext();
      attachAnalyser(currentUser.id, stream);
      updateMySeat(0);
    }

    // Fetch a real TURN relay (see /api/voice-rooms/turn-credentials)
    // before connecting to anyone — needed for EVERY participant,
    // listeners included, since a receive-only connection still has
    // to cross the same NATs a send connection would. Silently keeps
    // the STUN-only fallback on any failure (missing config, network
    // hiccup, etc.) rather than blocking the join.
    try {
      const res = await fetch("/api/voice-rooms/turn-credentials");
      if (res.ok) {
        const { iceServers } = await res.json();
        if (Array.isArray(iceServers) && iceServers.length > 0) {
          iceServersRef.current = [...FALLBACK_ICE_SERVERS, ...iceServers];
        }
      }
    } catch {
      // keep FALLBACK_ICE_SERVERS
    }

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
        updatePhase("ended");
      })
      .on("broadcast", { event: "kick" }, ({ payload }: { payload: { targetId: string } }) => {
        if (payload.targetId === currentUser.id) {
          teardown();
          updatePhase("kicked");
        }
      })
      .on("broadcast", { event: "mute-all" }, () => {
        // Only affects someone who's currently speaking with a live,
        // unmuted mic — a plain listener has no mic to mute in the
        // first place, and this is a one-time nudge (not a lock):
        // anyone can unmute themselves again afterward.
        if (!localStreamRef.current || micMutedRef.current) return;
        updateMicMuted(true);
        localStreamRef.current.getAudioTracks().forEach((tr) => {
          tr.enabled = false;
        });
        channelRef.current?.track(myPresence(true, mySeatRef.current)).catch(() => {});
      })
      .on("broadcast", { event: "chat" }, ({ payload }: { payload: { name: string; text: string } }) => {
        pushChatMessage({ kind: "chat", name: payload.name, text: payload.text });
      })
      .on("presence", { event: "sync" }, () => {
        syncMembers();
      })
      .on(
        "presence",
        { event: "join" },
        ({ key, newPresences }: { key: string; newPresences: RoomMember[] }) => {
          maybeInitiate(key);
          const p = newPresences?.[0];
          if (p && p.id !== currentUser.id) {
            pushChatMessage({ kind: "system", text: t("joinedRoom", { name: p.displayName || p.username }) });
          }
        }
      )
      .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
        if (key !== currentUser.id) cleanupPeer(key);
      })
      .subscribe(async (status: string) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track(myPresence(false, isHost ? 0 : null));
        updatePhase("joined");
      });
  }

  /** A non-host participant tapping an empty numbered seat — the only
   * moment a regular guest is ever asked for microphone access. */
  async function takeSeat(seatNumber: number) {
    if (isHost || mySeatRef.current != null || seatBusySeat != null) return;
    setSeatBusySeat(seatNumber);
    setSeatError(null);

    if (!localStreamRef.current) {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setSeatBusySeat(null);
        setSeatError(t("micDenied"));
        return;
      }
      localStreamRef.current = stream;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      attachAnalyser(currentUser.id, stream);
    }

    updateMySeat(seatNumber);
    await channelRef.current?.track(myPresence(micMutedRef.current, seatNumber)).catch(() => {});

    // We just went from "nothing to send" to "a live mic" — re-check
    // every current member: some pairs (us + another plain listener)
    // never got a connection at all (see isSpeaker/maybeInitiate), and
    // some (us + an existing speaker we were only listening to)
    // already have one that now needs to be upgraded to carry our
    // track too.
    Object.keys(membersRef.current).forEach((id) => {
      if (id === currentUser.id) return;
      if (peersRef.current[id]) {
        void renegotiate(id);
      } else {
        maybeInitiate(id);
      }
    });

    setSeatBusySeat(null);
  }

  function leaveRoom() {
    teardown();
    updatePhase("left");
    router.push("/voice-rooms");
  }

  /** Toggles YOUR OWN mic — works whether you're the host or seated;
   * a plain listener never sees this control at all (see the render
   * below), since they have no mic to toggle. */
  function toggleMic() {
    const next = !micMutedRef.current;
    updateMicMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((tr) => {
      tr.enabled = !next;
    });
    channelRef.current
      ?.track(myPresence(next, isHost ? 0 : mySeatRef.current))
      .catch(() => {});
  }

  async function endRoomForEveryone() {
    setEndingBusy(true);
    const res = await fetch(`/api/voice-rooms/${room.id}/end`, { method: "POST" });
    setEndingBusy(false);
    if (res.ok) {
      channelRef.current?.send({ type: "broadcast", event: "room-ended", payload: {} });
      teardown();
      updatePhase("ended");
    }
  }

  /** Host-only: asks everyone currently speaking to mute themselves —
   * a one-time nudge (see the "mute-all" listener above), not a lock;
   * useful when a room gets noisy without having to remove anyone. */
  function muteAllOthers() {
    if (!isHost) return;
    channelRef.current?.send({ type: "broadcast", event: "mute-all", payload: {} });
  }

  /**
   * Host-only: removes one participant from the LIVE call AND keeps
   * them out for the rest of this room (see the RoomMember "banned"
   * comment and syncMembers above) — mirroring how "room-ended"
   * already works, this is a targeted broadcast on the same room
   * channel every client is already listening on, since there's no
   * participant row in Postgres to delete in the first place. Like
   * "room-ended", this is enforced by every well-behaved client
   * honoring it (the UI only exposes it to the host, and only the
   * host's own presence carries the ban list) rather than by the
   * server, which was never told who is in the room to begin with.
   */
  function kickMember(memberId: string) {
    if (!isHost || memberId === currentUser.id) return;
    bannedIdsRef.current.add(memberId);
    channelRef.current?.track(myPresence(micMutedRef.current, 0)).catch(() => {});
    channelRef.current?.send({
      type: "broadcast",
      event: "kick",
      payload: { targetId: memberId },
    });
  }

  function sendChat() {
    const text = chatDraft.trim();
    if (!text || phase !== "joined") return;
    setChatDraft("");
    const name = currentUser.displayName || currentUser.username;
    channelRef.current?.send({ type: "broadcast", event: "chat", payload: { name, text } });
    // Broadcasts aren't echoed back to their own sender, so show it
    // locally right away instead of waiting on a round trip.
    pushChatMessage({ kind: "chat", name, text });
  }

  async function submitReport(reason: (typeof REPORT_REASONS)[number]) {
    if (!reportTarget || reportSubmitting) return;
    setReportSubmitting(true);
    const res = await fetch(`/api/users/${reportTarget.username}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details: reportDetails.trim() || undefined }),
    });
    setReportSubmitting(false);
    if (res.ok) {
      setReportedIds((prev) => new Set(prev).add(reportTarget.id));
      setReportTarget(null);
      setReportDetails("");
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

  // Auto-scroll the chat/system feed as new lines arrive.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Tear everything down if the user navigates away mid-call.
  useEffect(() => {
    return () => {
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memberList = Object.values(members);
  const seatOccupants: Record<number, RoomMember> = {};
  const audienceCount = (() => {
    let count = 0;
    for (const m of memberList) {
      if (m.id === room.host.id) continue;
      if (m.seat != null && m.seat >= 1 && m.seat <= SEAT_COUNT) {
        seatOccupants[m.seat] = m;
      } else {
        count += 1;
      }
    }
    return count;
  })();
  // The host's own slot always shows, even before they've connected —
  // static info from the `room` prop stands in until their live
  // presence (with mic state) arrives.
  const hostDisplay: RoomMember = members[room.host.id] ?? {
    id: room.host.id,
    username: room.host.username,
    displayName: room.host.displayName,
    avatarUrl: room.host.avatarUrl,
    isMuted: false,
    seat: 0,
  };

  return (
    <div className="stage-night flex flex-1 flex-col overflow-hidden rounded-3xl shadow-lg">
      {/* Hidden audio sinks for every connected remote peer. */}
      {Object.entries(remoteStreamsRef.current).map(([id, stream]) => (
        <audio
          key={id}
          autoPlay
          playsInline
          className="hidden"
          ref={(el) => {
            if (!el) return;
            if (el.srcObject !== stream) el.srcObject = stream;
            playAudioEl(id, el);
          }}
        />
      ))}

      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            {t("live")}
            {phase === "joined" && (
              <span className="eq-bars text-amber-300">
                <span />
                <span />
                <span />
                <span />
              </span>
            )}
          </p>
          <h1 className="truncate text-lg font-bold text-white">{room.topic}</h1>
          <p className="truncate text-xs text-white/60">
            {t("hostedBy", { name: room.host.displayName || room.host.username })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {phase === "joined" && memberList.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1">
              <div className="flex -space-x-2">
                {memberList.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="h-5 w-5 overflow-hidden rounded-full bg-gray-600 ring-1 ring-black/40"
                  >
                    {m.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-xs font-semibold text-white">{memberList.length}</span>
            </div>
          )}
          {isHost && phase === "joined" && (
            <button
              onClick={muteAllOthers}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              {t("muteAllButton")}
            </button>
          )}
          {isHost && phase !== "ended" && phase !== "kicked" && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={endingBusy}
              onClick={endRoomForEveryone}
              className="rounded-full bg-red-500/90 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {t("endRoomButton")}
            </motion.button>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 p-4">
        {phase === "ended" && (
          <div className="text-center">
            <p className="text-4xl">👋</p>
            <p className="mt-3 font-semibold text-white">{t("roomEnded")}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/voice-rooms")}
              className="mt-4 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-110"
            >
              {t("backToList")}
            </motion.button>
          </div>
        )}

        {phase === "kicked" && (
          <div className="text-center">
            <p className="text-4xl">🚫</p>
            <p className="mt-3 font-semibold text-red-300">{t("kicked")}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/voice-rooms")}
              className="mt-4 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-110"
            >
              {t("backToList")}
            </motion.button>
          </div>
        )}

        {phase === "mic-denied" && (
          <div className="text-center">
            <p className="text-4xl">🎙️</p>
            <p className="mt-3 font-semibold text-red-300">{t("micDenied")}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={joinRoom}
              className="mt-4 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-110"
            >
              {t("tryAgain")}
            </motion.button>
          </div>
        )}

        {(phase === "idle" || phase === "left") && (
          <div className="text-center">
            <p className="text-4xl">🎧</p>
            <p className="mt-3 text-sm text-white/70">{t("joinPrompt")}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={joinRoom}
              className="mt-4 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-110"
            >
              {t("joinButton")}
            </motion.button>
          </div>
        )}

        {phase === "connecting" && (
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
            <p className="mt-3 text-sm text-white/60">{t("connecting")}</p>
          </div>
        )}

        {phase === "joined" && (
          <>
            {needsAudioUnlock && (
              <motion.button
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={unlockAudio}
                className="rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent-500/25"
              >
                {t("enableSound")}
              </motion.button>
            )}

            <div className="relative aspect-[4/5] w-full max-w-sm flex-1">
              <AnimatePresence initial={false}>
                <motion.div key="host" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
                  <VoiceSeat
                    position={{ xPct: 50, yPct: 50 }}
                    member={hostDisplay}
                    isHostSlot
                    big
                    speaking={speakingIds.has(hostDisplay.id)}
                    isMe={isHost}
                    onReport={
                      !isHost && !reportedIds.has(hostDisplay.id) ? () => setReportTarget(hostDisplay) : undefined
                    }
                    reported={reportedIds.has(hostDisplay.id)}
                  />
                </motion.div>
                {SEAT_LAYOUT.map((pos, idx) => {
                  const seatNumber = idx + 1;
                  const occupant = seatOccupants[seatNumber];
                  const isMe = occupant?.id === currentUser.id;
                  return (
                    <motion.div
                      key={seatNumber}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                    >
                      <VoiceSeat
                        position={pos}
                        seatNumber={seatNumber}
                        member={occupant}
                        speaking={occupant ? speakingIds.has(occupant.id) : false}
                        isMe={isMe}
                        onTapEmpty={() => takeSeat(seatNumber)}
                        seatBusy={seatBusySeat === seatNumber}
                        onReport={
                          occupant && !isMe && !reportedIds.has(occupant.id)
                            ? () => setReportTarget(occupant)
                            : undefined
                        }
                        onKick={isHost && occupant && !isMe ? () => kickMember(occupant.id) : undefined}
                        reported={occupant ? reportedIds.has(occupant.id) : false}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {seatError && <p className="text-center text-xs text-red-300">{seatError}</p>}
            {audienceCount > 0 && (
              <p className="text-center text-[11px] text-white/50">{t("audienceWatching", { count: audienceCount })}</p>
            )}

            {(isHost || mySeat != null) && (
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={toggleMic}
                title={micMuted ? t("unmuteSelf") : t("muteSelf")}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg shadow-lg transition ${
                  micMuted
                    ? "bg-red-500/20 text-red-300"
                    : "bg-gradient-to-br from-amber-400 to-pink-500 text-white shadow-orange-500/30"
                }`}
              >
                {micMuted ? "🔇" : "🎙️"}
              </motion.button>
            )}

            <div className="flex w-full max-w-sm flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-0.5 overflow-y-auto px-1">
                {chatMessages.map((m) => (
                  <p
                    key={m.id}
                    className={`truncate text-xs ${m.kind === "system" ? "text-amber-200/80" : "text-white/85"}`}
                  >
                    {m.kind === "chat" && <span className="font-semibold">{m.name}: </span>}
                    {m.text}
                  </p>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder={t("sayHiPlaceholder")}
                  maxLength={200}
                  className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-amber-300/60"
                />
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={leaveRoom}
                  title={t("leaveButton")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-lg text-white shadow-lg shadow-red-600/25 transition hover:brightness-110"
                >
                  📴
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Report panel — same reason set as PostCard's post-report menu
          (see /api/users/[username]/report), just triggered from
          inside a live room instead of from a post. Rendered as a
          full overlay rather than inline like PostCard's, since the
          seat ring above is small and tightly packed. */}
      <AnimatePresence>
        {reportTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setReportTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl dark:bg-gray-800"
            >
              <p className="text-sm font-medium">
                {tr("reportUserTitle", { name: reportTarget.displayName || reportTarget.username })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => submitReport(reason)}
                    disabled={reportSubmitting}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {tr(REPORT_REASON_KEY[reason] as any)}
                  </button>
                ))}
              </div>
              <input
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={tr("reasonOther")}
                className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
              <button
                onClick={() => setReportTarget(null)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                {tr("cancel")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
