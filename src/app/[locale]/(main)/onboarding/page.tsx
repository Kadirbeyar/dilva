"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import AvatarUploader from "@/components/profile/AvatarUploader";
import { flagEmoji } from "@/lib/languageFlags";
import { MIN_SIGNUP_AGE } from "@/lib/age";
import { WORLD_COUNTRIES } from "@/lib/countries";
import { countriesMatch, resolveToWorldCountry } from "@/lib/countryMatch";
import { getStoredReferralCode, clearStoredReferralCode } from "@/lib/referralCapture";
import { isPushSupported, subscribeToPush } from "@/lib/pushClient";

type Language = { code: string; name: string; nativeName: string };
type TargetRow = { code: string; proficiency: string };

const PROFICIENCIES = ["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "ADVANCED", "FLUENT"];
const GENDERS = ["MALE", "FEMALE", "PREFER_NOT_TO_SAY"] as const;
const MAX_TARGETS = 4;

function maxBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_SIGNUP_AGE);
  return d.toISOString().slice(0, 10);
}

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [country, setCountry] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [nativeCode, setNativeCode] = useState("");
  const [targets, setTargets] = useState<TargetRow[]>([{ code: "", proficiency: "BEGINNER" }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mandatory GPS check: an account can't be finished unless the
  // browser's location resolves to the SAME country the user picked
  // above. Blocks impersonating a country for matching purposes.
  // "denied" also covers a geolocation API/timeout failure and a
  // reverse-geocoding lookup failure — all of them are dead ends that
  // only a retry can get past, so they share one blocking UI state.
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "checking" | "denied" | "unsupported" | "mismatch" | "match"
  >("idle");
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Mandatory notification opt-in, mirroring the location block above:
  // once a Dilva account is added to the phone's home screen, push
  // notifications are the only way a user finds out about a new
  // message/like/match without having the app open, so it's enforced
  // here rather than left as a skippable settings toggle.
  const [notificationStatus, setNotificationStatus] = useState<
    "idle" | "checking" | "granted" | "denied" | "unsupported"
  >("idle");

  async function requestNotifications() {
    setNotificationStatus("checking");
    if (!isPushSupported()) {
      setNotificationStatus("unsupported");
      return;
    }
    const ok = await subscribeToPush();
    setNotificationStatus(ok ? "granted" : "denied");
  }

  // Re-evaluate match/mismatch if the user changes the country
  // dropdown after we already have a detected location (e.g. they
  // pick the wrong one first, verify, then switch to the right one).
  useEffect(() => {
    if (!detectedCountry) return;
    setLocationStatus(countriesMatch(detectedCountry, country) ? "match" : "mismatch");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  function verifyLocation() {
    setLocationStatus("checking");
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (!res.ok) throw new Error("lookup failed");
          const data = await res.json();
          const detected = resolveToWorldCountry(data.countryName) ?? data.countryName ?? null;
          setDetectedCountry(detected);
          setLocationStatus(detected && countriesMatch(detected, country) ? "match" : "mismatch");
        } catch {
          setLocationStatus("denied");
        }
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: false, timeout: 15000 }
    );
  }

  useEffect(() => {
    // Sequential, not parallel: Dilva's DB connection goes through
    // Supabase's pooler with connection_limit=1.
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUserId(data.user.id);

      const res = await fetch("/api/languages");
      const d = await res.json();
      setLanguages(d.languages ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateTarget(i: number, patch: Partial<TargetRow>) {
    setTargets((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function addTarget() {
    setTargets((prev) => (prev.length < MAX_TARGETS ? [...prev, { code: "", proficiency: "BEGINNER" }] : prev));
  }

  function removeTarget(i: number) {
    setTargets((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const chosenTargets = targets.filter((row) => row.code);
    if (!nativeCode || chosenTargets.length === 0) {
      setError(t("pickLanguagesError"));
      return;
    }
    if (!country) {
      setError(t("countryRequiredError"));
      return;
    }
    if (!birthDate) {
      setError(t("birthDateRequiredError"));
      return;
    }
    if (locationStatus !== "match") {
      setError(t("locationRequiredError"));
      return;
    }
    if (notificationStatus !== "granted") {
      setError(t("notificationRequiredError"));
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/profile/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        displayName: displayName || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        country,
        birthDate,
        gender: gender || undefined,
        nativeLanguages: [{ code: nativeCode }],
        targetLanguages: chosenTargets,
        latitude: coords?.lat,
        longitude: coords?.lng,
        referralCode: getStoredReferralCode() || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "username_taken") setError(t("usernameTaken"));
      else if (data.error === "underage") setError(t("underageError", { minAge: MIN_SIGNUP_AGE }));
      else setError(tc("error"));
      return;
    }

    clearStoredReferralCode();
    router.push("/feed");
  }

  return (
    <main className="relative mx-auto flex min-h-[calc(100dvh-64px)] max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="bg-mesh" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-shadow-lift rounded-3xl bg-white p-7 dark:bg-gray-800"
      >
        <h1 className="text-center text-2xl font-bold">{t("title")}</h1>

        <div className="mt-6 flex justify-center">
          {userId && (
            <AvatarUploader userId={userId} currentUrl={avatarUrl} onUploaded={setAvatarUrl} />
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("usernameLabel")}</span>
            <input
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t("usernameHint")}</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("displayNameLabel")}</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("birthDateLabel")}</span>
              <input
                type="date"
                required
                max={maxBirthDate()}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">{t("birthDateHint", { minAge: MIN_SIGNUP_AGE })}</span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("genderLabel")}</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">{t("genderSkip")}</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {t(`genderOption_${g}` as any)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("countryLabel")}</span>
            <select
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="" disabled>
                {t("countryPlaceholder")}
              </option>
              {WORLD_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div
            className={`rounded-xl border p-3.5 ${
              locationStatus === "match"
                ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                : locationStatus === "mismatch" || locationStatus === "denied" || locationStatus === "unsupported"
                  ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                  : "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900"
            }`}
          >
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("locationTitle")}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t("locationRequiredNote")}</p>

            {locationStatus === "match" && (
              <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">
                ✓ {t("locationConfirmed", { country: detectedCountry ?? country })}
              </p>
            )}

            {locationStatus === "mismatch" && (
              <div className="mt-2">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {t("locationMismatch", { detected: detectedCountry ?? "?", selected: country })}
                </p>
                {detectedCountry && WORLD_COUNTRIES.includes(detectedCountry) && (
                  <button
                    type="button"
                    onClick={() => setCountry(detectedCountry)}
                    className="mt-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white"
                  >
                    {t("locationUseDetected", { country: detectedCountry })}
                  </button>
                )}
              </div>
            )}

            {(locationStatus === "denied" || locationStatus === "unsupported") && (
              <p className="mt-2 text-sm text-red-700 dark:text-red-400">{t("locationDenied")}</p>
            )}

            {locationStatus !== "match" && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={verifyLocation}
                disabled={locationStatus === "checking"}
                className="mt-2.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {locationStatus === "checking" ? tc("loading") : t("locationButton")}
              </motion.button>
            )}
          </div>

          <div
            className={`rounded-xl border p-3.5 ${
              notificationStatus === "granted"
                ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                : notificationStatus === "denied" || notificationStatus === "unsupported"
                  ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                  : "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900"
            }`}
          >
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("notificationTitle")}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t("notificationRequiredNote")}</p>

            {notificationStatus === "granted" && (
              <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">
                ✓ {t("notificationConfirmed")}
              </p>
            )}

            {(notificationStatus === "denied" || notificationStatus === "unsupported") && (
              <p className="mt-2 text-sm text-red-700 dark:text-red-400">{t("notificationDenied")}</p>
            )}

            {notificationStatus !== "granted" && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={requestNotifications}
                disabled={notificationStatus === "checking"}
                className="mt-2.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {notificationStatus === "checking" ? tc("loading") : t("notificationButton")}
              </motion.button>
            )}
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("bioLabel")}</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("bioPlaceholder")}
              rows={3}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("nativeLanguageLabel")}</span>
            <select
              required
              value={nativeCode}
              onChange={(e) => setNativeCode(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="" disabled>
                —
              </option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {flagEmoji(l.code)} {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("targetLanguageLabel")}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t("targetLanguageCount", { count: targets.length, max: MAX_TARGETS })}</span>
            </div>

            <AnimatePresence initial={false}>
              {targets.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <select
                    required={i === 0}
                    value={row.code}
                    onChange={(e) => updateTarget(i, { code: e.target.value })}
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="" disabled={i === 0}>
                      {i === 0 ? "—" : t("targetLanguageOptionalPlaceholder")}
                    </option>
                    {languages
                      .filter((l) => l.code !== nativeCode)
                      .map((l) => (
                        <option key={l.code} value={l.code}>
                          {flagEmoji(l.code)} {l.nativeName} ({l.name})
                        </option>
                      ))}
                  </select>
                  <select
                    value={row.proficiency}
                    onChange={(e) => updateTarget(i, { proficiency: e.target.value })}
                    className="w-32 shrink-0 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  >
                    {PROFICIENCIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => removeTarget(i)}
                      aria-label={t("removeLanguage")}
                      className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {targets.length < MAX_TARGETS && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addTarget}
                className="mt-1 self-start rounded-full border border-dashed border-brand-300 px-3.5 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/30"
              >
                + {t("addLanguage")}
              </motion.button>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting || locationStatus !== "match" || notificationStatus !== "granted"}
            className="mt-2 rounded-full bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? tc("loading") : t("finish")}
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
