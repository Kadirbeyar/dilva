"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import AvatarUploader from "@/components/profile/AvatarUploader";
import PushNotificationToggle from "@/components/settings/PushNotificationToggle";
import { flagEmoji } from "@/lib/languageFlags";
import { MIN_SIGNUP_AGE } from "@/lib/age";
import { WORLD_COUNTRIES } from "@/lib/countries";

type Language = { code: string; name: string; nativeName: string };
type UserLanguageRow = { languageCode: string; type: "NATIVE" | "LEARNING"; proficiency: string | null };
type TargetRow = { code: string; proficiency: string };

const PROFICIENCIES = ["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "ADVANCED", "FLUENT"];
const GENDERS = ["MALE", "FEMALE", "PREFER_NOT_TO_SAY"] as const;
const MAX_TARGETS = 4;

function maxBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_SIGNUP_AGE);
  return d.toISOString().slice(0, 10);
}

export default function SettingsPage() {
  const t = useTranslations("onboarding");
  const tProfile = useTranslations("profile");
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
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadProfile() {
    setLoadError(false);

    // Sequential, not fire-and-forget in parallel: Dilva's DB
    // connection goes through Supabase's pooler with
    // connection_limit=1, so several requests landing at once here
    // just queue up and risk a pool-timeout instead of actually
    // loading any faster.
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUserId(data.user.id);

      const langRes = await fetch("/api/languages");
      const langData = await langRes.json();
      setLanguages(langData.languages ?? []);

      const meRes = await fetch("/api/profile/me");
      if (!meRes.ok) throw new Error(`profile/me returned ${meRes.status}`);
      const meData = await meRes.json();
      const p = meData.profile;
      // Previously this silently returned here, leaving the page
      // stuck on the loading screen forever with no error shown —
      // this looked like a permanently blank/empty settings page.
      if (!p) throw new Error("profile/me returned no profile");

      setUsername(p.username ?? "");
      setDisplayName(p.displayName ?? "");
      setBio(p.bio ?? "");
      setAvatarUrl(p.avatarUrl ?? "");
      setGender(p.gender ?? "");
      setCountry(p.country ?? "");
      if (p.birthDate) setBirthDate(String(p.birthDate).slice(0, 10));

      const rows = (p.languages as UserLanguageRow[]) ?? [];
      const native = rows.find((l) => l.type === "NATIVE");
      const learning = rows.filter((l) => l.type === "LEARNING");
      if (native) setNativeCode(native.languageCode);
      if (learning.length > 0) {
        setTargets(
          learning.map((l) => ({ code: l.languageCode, proficiency: l.proficiency ?? "BEGINNER" }))
        );
      }
      setLoaded(true);
    } catch (err) {
      console.error("[settings] failed to load profile", err);
      setLoadError(true);
    }
  }

  useEffect(() => {
    loadProfile();
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
    setSaved(false);

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

    setSaved(true);
    router.refresh();
  }

  if (loadError) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{tc("error")}</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={loadProfile}
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          {tc("retry")}
        </motion.button>
      </main>
    );
  }

  if (!loaded) {
    return <main className="mx-auto max-w-md px-6 py-16 text-center text-gray-500 dark:text-gray-400">{tc("loading")}</main>;
  }

  return (
    <main className="relative mx-auto max-w-md px-6 py-10">
      <div className="bg-mesh" aria-hidden="true" />

      <PushNotificationToggle />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-shadow mt-4 rounded-3xl bg-white p-7 dark:bg-gray-800"
      >
        <h1 className="text-2xl font-bold">{tProfile("editProfile")}</h1>

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
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">
              🔒 {t("countryLabel")}
            </span>
            {/* Locked, not editable here: the country was verified against
                the user's real GPS location at signup (see onboarding's
                mandatory location check) — letting it be freely changed
                afterward from Settings would undo that verification
                entirely. The <select> still submits the existing value
                (required by /api/profile/complete's schema), it's just
                not user-editable. */}
            <select
              required
              disabled
              value={country}
              className="cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-gray-500 outline-none dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-400"
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
            <span className="text-xs text-gray-500 dark:text-gray-400">{t("countryLockedHint")}</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("bioLabel")}</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
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
          {saved && <p className="text-sm text-green-600">✓</p>}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? tc("loading") : tc("save")}
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
