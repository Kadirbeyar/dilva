"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import PremiumCrown from "@/components/profile/PremiumCrown";

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  originalLanguageCode: string | null;
  mediaUrl?: string | null;
  createdAt: string;
};

type OtherUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPremiumCached: boolean;
  isOnline: boolean;
};

// A just-sent message gets a synthetic id in this shape until the
// server confirms it — see sendMessage()/ingestSingle() below.
function isTempId(id: string) {
  return id.startsWith("temp-");
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function formatTime(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "ku" ? "en" : locale, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatDayLabel(iso: string, locale: string) {
  const d = new Date(iso);
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString());
  const key = dayKey(iso);
  if (key === today) return null; // handled by caller via translation key
  if (key === yesterday) return "yesterday";
  try {
    return new Intl.DateTimeFormat(locale === "ku" ? "en" : locale, {
      day: "numeric",
      month: "short",
      year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    }).format(d);
  } catch {
    return key;
  }
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
}: {
  conversationId: string;
  currentUserId: string;
  otherUser: OtherUser | null;
}) {
  const t = useTranslations("chat");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [translateErrorId, setTranslateErrorId] = useState<string | null>(null);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  // Every message id we've ever rendered (server-confirmed), so a
  // message arriving twice — once via polling, once via Realtime, or
  // once as our own optimistic echo — never gets appended twice.
  const knownIdsRef = useRef<Set<string>>(new Set());

  function markRead() {
    fetch(`/api/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});
  }

  function applyParticipants(participants: { userId: string; lastReadAt: string | null }[]) {
    const other = participants.find((p) => p.userId !== currentUserId);
    setOtherLastReadAt(other?.lastReadAt ?? null);
  }

  /**
   * Merges one freshly-confirmed message (from our own send, a
   * Realtime INSERT, or a poll) into state exactly once, dropping the
   * matching optimistic placeholder if there is one.
   */
  function ingestSingle(m: ChatMessage) {
    if (knownIdsRef.current.has(m.id)) return;
    knownIdsRef.current.add(m.id);
    setMessages((prev) => {
      const withoutMatchingTemp = prev.filter(
        (p) => !(isTempId(p.id) && p.senderId === m.senderId && p.content === m.content && p.type === m.type)
      );
      return [...withoutMatchingTemp, m];
    });
    if (m.senderId !== currentUserId) markRead();
  }

  /**
   * Merges the full server-side message list (initial load, or the
   * polling fallback below) into state — keeping any still-pending
   * optimistic message that hasn't shown up on the server yet.
   */
  function ingestFullList(list: ChatMessage[]) {
    const isFirstLoad = knownIdsRef.current.size === 0;
    // Defensive: a fetch that comes back empty after we've already
    // seen real messages is a transient hiccup (e.g. a pool-timeout
    // on the connection_limit=1 DB), never proof the conversation is
    // actually empty — so never let it erase what's on screen. This
    // is what was causing messages to "disappear" after a poll.
    if (!isFirstLoad && list.length === 0 && knownIdsRef.current.size > 0) return;
    const newFromOther = list.filter(
      (m) => !knownIdsRef.current.has(m.id) && m.senderId !== currentUserId
    );
    list.forEach((m) => knownIdsRef.current.add(m.id));
    setMessages((prev) => {
      const stillPendingTemp = prev.filter(
        (p) =>
          isTempId(p.id) &&
          !list.some((f) => f.senderId === p.senderId && f.content === p.content && f.type === p.type)
      );
      return [...list, ...stillPendingTemp];
    });
    if (!isFirstLoad && newFromOther.length > 0) markRead();
  }

  // Initial history load, then mark everything from the other side as read.
  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
        return r.json();
      })
      .then((d) => {
        ingestFullList(d.messages ?? []);
        applyParticipants(d.participants ?? []);
      })
      .then(markRead)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Polling fallback — re-fetches the full message list + read
  // positions every few seconds. Supabase Realtime (below) delivers
  // updates instantly when it's enabled on the "messages" table, but
  // this app has no guarantee that `alter publication supabase_realtime
  // add table messages;` was ever run, so messages must still arrive
  // reliably without it. ingestFullList() de-dupes against Realtime so
  // running both never produces double messages. A failed poll is
  // silently skipped (never treated as "conversation is now empty") —
  // see the guard inside ingestFullList.
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/conversations/${conversationId}/messages`)
        .then((r) => {
          if (!r.ok) throw new Error("poll failed");
          return r.json();
        })
        .then((d) => {
          ingestFullList(d.messages ?? []);
          applyParticipants(d.participants ?? []);
        })
        .catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId]);

  // Realtime subscription — Supabase Realtime streams INSERTs on the
  // "messages" table straight to every participant, no polling.
  // Requires: alter publication supabase_realtime add table messages;
  // (see README "Enable Realtime"). If that hasn't been run, the
  // polling fallback above still gets messages through.
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          ingestSingle(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!draft.trim() || recording) return;
    const content = draft;
    setDraft("");

    // Optimistic append — show the message immediately instead of
    // waiting on Realtime/polling, which is what made sent messages
    // seem to vanish or take forever to appear.
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        content,
        type: "TEXT",
        originalLanguageCode: null,
        mediaUrl: null,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const { message } = await res.json();
        ingestSingle(message);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setDraft(content);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(content);
    }
  }

  /**
   * Voice messages — records with MediaRecorder, uploads straight to
   * the "chat-voice" Storage bucket from the browser (see
   * prisma/sql/03_storage_chat_voice.sql for the bucket + policies),
   * then sends a normal message with type "AUDIO" pointing at the
   * resulting public URL.
   */
  async function startRecording() {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void uploadAndSendVoice();
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setVoiceError(t("micDenied"));
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function uploadAndSendVoice() {
    const chunks = recordedChunksRef.current;
    if (chunks.length === 0) return;
    const blob = new Blob(chunks, { type: "audio/webm" });

    setUploadingVoice(true);
    const path = `${currentUserId}/${conversationId}-${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage
      .from("chat-voice")
      .upload(path, blob, { contentType: "audio/webm" });

    if (uploadError) {
      setUploadingVoice(false);
      setVoiceError(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("chat-voice").getPublicUrl(path);

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: t("voiceMessage"), type: "AUDIO", mediaUrl: publicUrl }),
    });
    if (res.ok) {
      const { message } = await res.json();
      ingestSingle(message);
    }
    setUploadingVoice(false);
  }

  async function toggleTranslate(message: ChatMessage) {
    if (translations[message.id]) {
      setTranslations((prev) => {
        const next = { ...prev };
        delete next[message.id];
        return next;
      });
      return;
    }
    setTranslateErrorId(null);
    setTranslatingId(message.id);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.content,
          target: locale,
          source: message.originalLanguageCode ?? "auto",
          messageId: message.id,
        }),
      });
      setTranslatingId(null);
      if (res.ok) {
        const { translatedText } = await res.json();
        setTranslations((prev) => ({ ...prev, [message.id]: translatedText }));
      } else {
        // Previously a failure here did nothing visible at all —
        // clicking "Translate" would just flash "…" and revert,
        // which looked exactly like the feature being broken with no
        // explanation. Now at least the failure is visible.
        setTranslateErrorId(message.id);
      }
    } catch {
      setTranslatingId(null);
      setTranslateErrorId(message.id);
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#f4f6fb] dark:bg-gray-950">
      {otherUser && (
        <div className="flex items-center gap-1 border-b border-black/5 bg-white/80 p-2.5 backdrop-blur dark:border-white/10 dark:bg-gray-900/80">
          <button
            onClick={() => router.back()}
            aria-label={tc("back")}
            className="shrink-0 rounded-full p-1.5 text-gray-500 hover:bg-black/5 lg:hidden dark:text-gray-400 dark:hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Link
            href={`/profile/${otherUser.username}` as any}
            className="flex flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1 transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-200 ring-2 ring-white dark:bg-gray-700 dark:ring-gray-900">
              {otherUser.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={otherUser.avatarUrl} alt="" className="h-full w-full object-cover" />
              )}
              {otherUser.isPremiumCached && <PremiumCrown />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{otherUser.displayName || otherUser.username}</p>
              {otherUser.isOnline && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {t("onlineNow")}
                </p>
              )}
            </div>
          </Link>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">{t("noConversations")}</p>
        )}
        <div className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => {
              const mine = m.senderId === currentUserId;
              const isLastMine = mine && !messages.slice(i + 1).some((later) => later.senderId === currentUserId);
              const seen =
                isLastMine && otherLastReadAt && new Date(otherLastReadAt) >= new Date(m.createdAt);
              const prev = messages[i - 1];
              const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
              const groupedWithPrev = prev && !newDay && prev.senderId === m.senderId;
              const dayLabelKey = newDay ? formatDayLabel(m.createdAt, locale) : null;
              return (
                <div key={m.id}>
                  {newDay && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
                        {dayLabelKey === null
                          ? t("today")
                          : dayLabelKey === "yesterday"
                            ? t("yesterday")
                            : dayLabelKey}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : "flex-row"} ${groupedWithPrev ? "mt-0.5" : "mt-2"}`}
                  >
                    {!mine && otherUser && (
                      <Link
                        href={`/profile/${otherUser.username}` as any}
                        className={`relative h-6 w-6 shrink-0 self-end overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${groupedWithPrev ? "invisible" : ""}`}
                      >
                        {otherUser.avatarUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={otherUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </Link>
                    )}
                    <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-3.5 py-2.5 text-sm shadow-sm ${
                          mine
                            ? "rounded-t-2xl rounded-bl-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-brand-700 text-white"
                            : "rounded-t-2xl rounded-br-2xl rounded-bl-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                        } ${isTempId(m.id) ? "opacity-60" : ""}`}
                      >
                        {m.type === "AUDIO" && m.mediaUrl ? (
                          <audio controls src={m.mediaUrl} className="h-9 max-w-[220px]" />
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap">{translations[m.id] ?? m.content}</p>
                            <button
                              onClick={() => toggleTranslate(m)}
                              disabled={translatingId === m.id}
                              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                mine ? "bg-white/15 text-white" : "bg-black/5 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                              }`}
                            >
                              🌐{" "}
                              {translatingId === m.id
                                ? "…"
                                : translations[m.id]
                                  ? t("original")
                                  : t("translate")}
                            </button>
                            {translateErrorId === m.id && (
                              <p className={`mt-0.5 text-[11px] ${mine ? "text-white/80" : "text-red-600"}`}>
                                {t("translateFailed")}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <p className="mt-0.5 px-1 text-[10px] text-gray-400 dark:text-gray-500">
                        {formatTime(m.createdAt, locale)}
                        {seen && <span className="ms-1.5 text-brand-500">· {t("seen")}</span>}
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-black/5 bg-white/90 p-2.5 backdrop-blur dark:border-white/10 dark:bg-gray-900/90">
        {voiceError && <p className="mb-1.5 px-1 text-xs text-red-600">{voiceError}</p>}
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-1.5 dark:border-gray-700 dark:bg-gray-800">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={t("typeMessage")}
            disabled={recording}
            className="flex-1 bg-transparent px-3 py-1.5 outline-none disabled:opacity-60"
          />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={recording ? stopRecording : startRecording}
            disabled={uploadingVoice}
            title={recording ? t("stopRecording") : t("recordVoice")}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm shadow-sm transition disabled:opacity-60 ${
              recording
                ? "animate-pulse bg-red-600 text-white"
                : "bg-white text-gray-600 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            {uploadingVoice ? "…" : recording ? "⏹" : "🎤"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={sendMessage}
            disabled={recording || !draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12l18-9-9 18-2-7-7-2z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
