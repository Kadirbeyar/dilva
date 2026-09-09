"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

// Leaflet touches `window` at import time, so the map must never be
// rendered on the server.
const NearbyMap = dynamic(() => import("@/components/map/NearbyMap"), {
  ssr: false,
});

type NearbyUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPremiumCached?: boolean;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

type MyVisibility = { hasCoords: boolean; visible: boolean };

export default function NearbyPage() {
  const t = useTranslations("nearby");
  const tc = useTranslations("common");
  const router = useRouter();

  const [status, setStatus] = useState<
    "idle" | "loading" | "locked" | "no-location" | "ready" | "error"
  >("idle");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [users, setUsers] = useState<NearbyUser[]>([]);

  // Being FOUND on the map is free for everyone — only viewing the
  // map (the state above) is Premium-gated. Tracked separately so a
  // non-Premium user can still turn this on and show up for Premium
  // viewers nearby, even though `status` above stays "locked" for them.
  const [myVisibility, setMyVisibility] = useState<MyVisibility | null>(null);
  const [savingVisibility, setSavingVisibility] = useState(false);

  async function loadMyVisibility() {
    try {
      const res = await fetch("/api/profile/me");
      if (!res.ok) return;
      const data = await res.json();
      const p = data.profile;
      setMyVisibility({
        hasCoords: p?.latitude != null && p?.longitude != null,
        visible: Boolean(p?.isLocationVisible),
      });
    } catch {
      // Non-critical — the visibility card just stays hidden if this fails.
    }
  }

  async function loadNearby() {
    setStatus("loading");
    try {
      const res = await fetch("/api/nearby");

      // Note: a 401 here isn't necessarily a real sign-out — it can
      // also mean our server briefly failed to reach Supabase to
      // verify the session (this project's database is in
      // ap-northeast-2, so a flaky connection can time out). The
      // middleware is what enforces real sign-outs on navigation, so
      // here we just show a retryable error instead of forcing a
      // jump to /login — that used to look like "getting logged out"
      // just from opening this page.
      if (res.status === 402) {
        setStatus("locked");
        return;
      }
      if (res.status === 400) {
        setStatus("no-location");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }

      const data = await res.json();
      setUsers(data.users ?? []);
      if (data.center) {
        // The server returns the viewer's own last-saved coordinates, so
        // the map can center itself on a normal page load — without this,
        // status could reach "ready" while `center` was still null (it
        // used to only get set inside shareLocation()), leaving the page
        // blank below the title.
        setCenter(data.center);
        setStatus("ready");
      } else {
        // No center to show a map around — treat like "no-location"
        // instead of silently rendering nothing.
        setStatus("no-location");
      }
    } catch {
      // Network error reaching our own API (e.g. dev server mid-restart).
      setStatus("error");
    }
  }

  /** First-time opt-in: gets a browser geolocation fix and turns visibility on. */
  function shareLocation() {
    setSavingVisibility(true);
    if (!navigator.geolocation) {
      setSavingVisibility(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await fetch("/api/profile/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, isLocationVisible: true }),
        });
        setMyVisibility({ hasCoords: true, visible: true });
        setSavingVisibility(false);
        // Refresh in case this viewer is Premium and didn't have a
        // center yet (status was "no-location").
        loadNearby();
      },
      () => setSavingVisibility(false)
    );
  }

  /** Toggles visibility on/off once coordinates already exist — no new geolocation prompt needed. */
  async function toggleVisibility(next: boolean) {
    if (next && !myVisibility?.hasCoords) {
      shareLocation();
      return;
    }
    setSavingVisibility(true);
    await fetch("/api/profile/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocationVisible: next }),
    });
    setMyVisibility((prev) => (prev ? { ...prev, visible: next } : prev));
    setSavingVisibility(false);
  }

  useEffect(() => {
    loadMyVisibility();
    loadNearby();
  }, []);

  return (
    <main className="relative mx-auto flex h-[calc(100dvh-2rem)] max-w-4xl flex-col px-4 py-4">
      <div className="bg-mesh" aria-hidden="true" />
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold"
      >
        {t("title")}
      </motion.h1>

      {/* Visibility card — shown to EVERY signed-in user, Premium or
          not, since being discoverable is free. Only the map view
          below is Premium-gated. */}
      {myVisibility && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-shadow mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 dark:bg-gray-800"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {t("visibilityTitle")}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t("visibilityHint")}</p>
          </div>
          <button
            onClick={() => toggleVisibility(!myVisibility.visible)}
            disabled={savingVisibility}
            aria-pressed={myVisibility.visible}
            className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
              myVisibility.visible ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                myVisibility.visible ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"
              }`}
            />
          </button>
        </motion.div>
      )}

      {status === "locked" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-shadow-lift mt-4 flex flex-1 flex-col items-center justify-center rounded-3xl bg-white p-8 text-center dark:bg-gray-800"
        >
          <div className="text-4xl">🗺️</div>
          <h2 className="mt-3 text-lg font-semibold">{t("lockedTitle")}</h2>
          <p className="mt-1 max-w-sm text-sm text-gray-600 dark:text-gray-300">{t("lockedSubtitle")}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/premium")}
            className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
          >
            {t("upgradeButton")}
          </motion.button>
        </motion.div>
      )}

      {(status === "no-location" || status === "idle") && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-shadow mt-4 flex flex-1 flex-col items-center justify-center rounded-3xl bg-white p-8 text-center dark:bg-gray-800"
        >
          <div className="text-4xl">📍</div>
          <p className="mt-2 max-w-sm text-sm text-gray-600 dark:text-gray-300">{t("enableLocationHint")}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={shareLocation}
            disabled={savingVisibility}
            className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50"
          >
            {t("enableLocation")}
          </motion.button>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-shadow mt-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl bg-white p-8 text-center dark:bg-gray-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{tc("error")}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={loadNearby}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {tc("retry")}
          </motion.button>
        </motion.div>
      )}

      {status === "loading" && (
        <div className="mt-4 flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="text-2xl"
          >
            ◐
          </motion.span>
        </div>
      )}

      {status === "ready" && center && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-shadow mt-4 flex-1 overflow-hidden rounded-2xl"
        >
          <NearbyMap center={center} users={users} />
        </motion.div>
      )}
    </main>
  );
}
