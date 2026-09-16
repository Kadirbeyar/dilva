"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { RADIO_STATIONS, type RadioStationCode } from "@/lib/radioStations";

type StationUrls = Record<RadioStationCode, string | null>;

/**
 * Floating radio button, visible to every signed-in user once an
 * admin has set at least one station's stream URL (see /admin →
 * Radio, /api/settings/radio). Hidden entirely while all four are
 * unset, so there's nothing broken to click in the meantime.
 *
 * Tapping the button always opens the station picker (rather than
 * directly toggling play/pause) — with four possible stations there's
 * no single obvious "the" station to resume, so the picker is both
 * how you start something and how you see/stop what's already
 * playing. A single <audio> element persists outside the picker's
 * AnimatePresence block, so closing the sheet never interrupts
 * playback — only picking a station (or the same one again) does.
 */
export default function RadioPlayerButton() {
  const t = useTranslations("radio");
  const [urls, setUrls] = useState<StationUrls | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [activeCode, setActiveCode] = useState<RadioStationCode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/settings/radio")
      .then((r) => r.json())
      .then((d) =>
        setUrls({
          ku: d.radioStreamUrlKu ?? null,
          tr: d.radioStreamUrlTr ?? null,
          ar: d.radioStreamUrlAr ?? null,
          en: d.radioStreamUrlEn ?? null,
        })
      )
      .catch(() => {});
  }, []);

  const stations = urls ? RADIO_STATIONS.filter((s) => urls[s.code]) : [];
  const activeStation = stations.find((s) => s.code === activeCode);

  function selectStation(code: RadioStationCode) {
    const audio = audioRef.current;
    if (!audio || !urls) return;
    setError(false);

    if (activeCode === code && playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    if (activeCode !== code) {
      audio.src = urls[code] as string;
      setActiveCode(code);
    }
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setError(true));
  }

  if (stations.length === 0) return null;

  return (
    <>
      <audio ref={audioRef} preload="none" onError={() => setError(true)} />

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setShowPicker(true)}
        title={activeStation ? `${activeStation.flag} ${activeStation.name}` : t("pickerTitle")}
        className={`radio-player-btn fixed bottom-20 end-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg transition sm:bottom-6 ${
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
            {t("playError")}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-t-3xl bg-white p-4 shadow-xl dark:bg-gray-800"
            >
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t("pickerTitle")}</p>

              <ul className="mt-3 flex flex-col gap-1">
                {stations.map((station) => {
                  const isActive = activeCode === station.code && playing;
                  return (
                    <li key={station.code}>
                      <button
                        onClick={() => selectStation(station.code)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
                          isActive
                            ? "bg-brand-50 dark:bg-brand-900/30"
                            : "hover:bg-gray-50 dark:hover:bg-gray-900"
                        }`}
                      >
                        <span className="text-xl">{station.flag}</span>
                        <span className="flex-1 font-medium text-gray-800 dark:text-gray-100">
                          {station.name}
                        </span>
                        <span className="text-lg">{isActive ? "⏸" : "▶️"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={() => setShowPicker(false)}
                className="mt-3 w-full rounded-full border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                {t("closeButton")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
