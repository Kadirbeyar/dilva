"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Floating radio button, visible to every signed-in user once an
 * admin has set a stream URL (see /admin → Radio, /api/settings/radio).
 * Hidden entirely until a URL is configured, so there's nothing
 * broken to click in the meantime.
 */
export default function RadioPlayerButton() {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/settings/radio")
      .then((r) => r.json())
      .then((d) => {
        setStreamUrl(d.radioStreamUrl ?? null);
        setLabel(d.radioLabel ?? null);
      })
      .catch(() => {});
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    setError(false);
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setError(true));
    }
  }

  if (!streamUrl) return null;

  return (
    <>
      <audio ref={audioRef} src={streamUrl} preload="none" onError={() => setError(true)} />
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={toggle}
        title={label ?? "Radio"}
        className={`fixed bottom-20 end-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg transition sm:bottom-6 ${
          playing
            ? "animate-pulse bg-brand-600 text-white shadow-brand-600/40"
            : "bg-white text-brand-600 shadow-black/10 dark:bg-gray-800"
        }`}
      >
        📻
      </motion.button>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-36 end-4 z-40 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white shadow-lg sm:bottom-24"
          >
            Couldn&apos;t play the stream
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}
