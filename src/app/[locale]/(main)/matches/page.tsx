"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import LanguageFlag from "@/components/shared/LanguageFlag";
import PremiumCrown from "@/components/profile/PremiumCrown";
import { flagEmoji } from "@/lib/languageFlags";
import { calculateAge } from "@/lib/age";
import { WORLD_COUNTRIES } from "@/lib/countries";

type MatchUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  country: string | null;
  isOnline: boolean;
  isPremium: boolean;
  birthDate: string | null;
  gender: string | null;
  languages: { languageCode: string; type: string }[];
};

type Match = { matchScore: 1 | 2; user: MatchUser };
type Language = { code: string; name: string; nativeName: string };

export default function MatchesPage() {
  const t = useTranslations("matches");
  const tProfile = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();

  const [mode, setMode] = useState<"matches" | "all">("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [country, setCountry] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);

  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [gender, setGender] = useState("");
  const [languageCode, setLanguageCode] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{
    minAge: string;
    maxAge: string;
    gender: string;
    languageCode: string;
  }>({ minAge: "", maxAge: "", gender: "", languageCode: "" });

  useEffect(() => {
    // Sequential, not parallel: Dilva's DB connection goes through
    // Supabase's pooler with connection_limit=1.
    (async () => {
      const meRes = await fetch("/api/profile/me");
      const meData = await meRes.json();
      setIsPremium(Boolean(meData.profile?.isPremiumCached));

      const langRes = await fetch("/api/languages");
      const langData = await langRes.json();
      setLanguages(langData.languages ?? []);
    })();
  }, []);

  // Debounce the search box so we're not firing a request on every
  // keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (onlineOnly) params.set("online", "true");
    if (country) params.set("country", country);
    if (isPremium) {
      if (appliedFilters.minAge) params.set("minAge", appliedFilters.minAge);
      if (appliedFilters.maxAge) params.set("maxAge", appliedFilters.maxAge);
      if (appliedFilters.gender) params.set("gender", appliedFilters.gender);
      if (appliedFilters.languageCode) params.set("languageCode", appliedFilters.languageCode);
    }

    let cancelled = false;

    // Dilva's DB connection has connection_limit=1 with real network
    // latency to the DB (Seoul region), so an otherwise-healthy search
    // can occasionally hit a pool timeout (P2024) and 500. Previously
    // that failure was silently swallowed (`d.results ?? []`), which
    // looked exactly like "no one found" even though nothing was
    // actually wrong with the account or the query. Check res.ok, and
    // retry once after a short pause before giving up and showing a
    // real error (distinct from a genuine empty result).
    async function load(attempt = 0): Promise<void> {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch(`/api/matches?${params.toString()}`);
        if (!res.ok) throw new Error(`matches returned ${res.status}`);
        const d = await res.json();
        if (cancelled) return;
        setMatches(d.results ?? []);
      } catch (err) {
        if (cancelled) return;
        if (attempt < 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (!cancelled) return load(attempt + 1);
        }
        console.error("[matches] failed to load", err);
        setMatches([]);
        setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [mode, debouncedQuery, onlineOnly, country, isPremium, appliedFilters, reloadTick]);

  function applyFilters() {
    if (!isPremium) return;
    setAppliedFilters({ minAge, maxAge, gender, languageCode });
    setShowFilters(false);
  }

  function clearFilters() {
    setMinAge("");
    setMaxAge("");
    setGender("");
    setLanguageCode("");
    setAppliedFilters({ minAge: "", maxAge: "", gender: "", languageCode: "" });
  }

  async function sayHi(userId: string) {
    const res = await fetch("/api/conversations/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: userId }),
    });
    if (res.ok) {
      const { conversationId } = await res.json();
      router.push(`/chat/${conversationId}` as any);
    }
  }

  const [waveStatus, setWaveStatus] = useState<Record<string, "sending" | "sent" | "cooldown">>({});

  async function wave(userId: string) {
    if (waveStatus[userId] === "sending" || waveStatus[userId] === "sent") return;
    setWaveStatus((prev) => ({ ...prev, [userId]: "sending" }));
    const res = await fetch("/api/conversations/wave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: userId }),
    });
    if (res.ok) {
      setWaveStatus((prev) => ({ ...prev, [userId]: "sent" }));
    } else if (res.status === 429) {
      setWaveStatus((prev) => ({ ...prev, [userId]: "cooldown" }));
    } else {
      setWaveStatus((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  }

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  return (
    <main className="relative mx-auto max-w-3xl px-4 py-8">
      <div className="bg-mesh" aria-hidden="true" />

      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold"
      >
        {t("title")}
      </motion.h1>
      <p className="mt-1 text-gray-600 dark:text-gray-300">{t("subtitle")}</p>

      <div className="relative mt-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label={tc("cancel")}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div
          className={`relative flex rounded-full bg-gray-100 p-1 text-sm font-medium dark:bg-gray-800 ${
            debouncedQuery ? "pointer-events-none opacity-40" : ""
          }`}
        >
          {(["matches", "all"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative z-10 rounded-full px-4 py-1.5 transition-colors ${
                mode === m ? "text-white" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId="matches-tab-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-brand-600"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {m === "matches" ? t("tabMatches") : t("tabBrowseAll")}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={country}
            onChange={(e) => {
              const value = e.target.value;
              // Picking a specific country is Premium-only — "any
              // country" stays free. A non-Premium viewer who picks
              // one gets nudged to the (already Premium-gated)
              // filters panel instead of the value actually applying.
              if (value && !isPremium) {
                setShowFilters(true);
                return;
              }
              setCountry(value);
            }}
            className="rounded-full border border-gray-200 px-3.5 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">{t("anyCountry")}</option>
            {WORLD_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {!isPremium && (
            <span className="pointer-events-none absolute -right-1 -top-1 text-xs">🔒</span>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => setOnlineOnly(e.target.checked)}
          />
          {t("filterOnlineNow")}
        </label>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowFilters((v) => !v)}
          className="ms-auto flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700"
        >
          🔎 {t("filtersButton")}
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{activeFilterCount}</span>
          )}
          {!isPremium && <span className="text-xs">🔒</span>}
        </motion.button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="card-shadow relative mt-3 rounded-2xl bg-white p-5 dark:bg-gray-800">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("filtersTitle")}</h2>

              <div
                className={`mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3 ${
                  !isPremium ? "pointer-events-none opacity-40" : ""
                }`}
              >
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("filterAgeRange")}</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={16}
                      max={100}
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      placeholder="18"
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="number"
                      min={16}
                      max={100}
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
                      placeholder="30"
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("filterGender")}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="">{t("genderAny")}</option>
                    <option value="MALE">{t("genderMale")}</option>
                    <option value="FEMALE">{t("genderFemale")}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("filterLanguage")}</label>
                  <select
                    value={languageCode}
                    onChange={(e) => setLanguageCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="">{t("anyLanguage")}</option>
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {flagEmoji(l.code)} {l.nativeName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isPremium ? (
                <div className="mt-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={applyFilters}
                    className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white"
                  >
                    {t("applyFilters")}
                  </motion.button>
                  <button
                    onClick={clearFilters}
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t("clearFilters")}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-brand-50/80 p-4 text-center dark:bg-brand-900/20">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("filtersLockedTitle")}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t("filtersLockedSubtitle")}</p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push("/premium")}
                    className="mt-1 rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white"
                  >
                    {t("upgradeButton")}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : loadError ? (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{tc("error")}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setReloadTick((n) => n + 1)}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {tc("retry")}
          </motion.button>
        </div>
      ) : matches.length === 0 ? (
        <p className="mt-8 text-gray-500 dark:text-gray-400">{t("noResults")}</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {matches.map(({ user, matchScore }, i) => (
              <motion.li
                key={user.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
                whileHover={{ y: -3 }}
                className="card-shadow flex flex-col gap-2 rounded-2xl bg-white p-4 transition-shadow hover:card-shadow-lift dark:bg-gray-800"
              >
                <Link href={`/profile/${user.username}` as any} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    {user.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {user.isPremium && <PremiumCrown size="md" />}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {user.displayName || user.username}
                      {user.birthDate && (
                        <span className="ms-1.5 font-normal text-gray-500 dark:text-gray-400">
                          · {tProfile("yearsOld", { age: calculateAge(user.birthDate) })}
                        </span>
                      )}
                      {matchScore === 2 && (
                        <span className="ms-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                          ✓✓
                        </span>
                      )}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      {user.country} {user.isOnline && "· ●"}
                    </p>
                  </div>
                </Link>

                {user.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {user.languages.map((l) => (
                      <span
                        key={l.languageCode + l.type}
                        className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      >
                        <LanguageFlag code={l.languageCode} className="h-3 w-4 rounded-[1px]" />
                        {l.languageCode}
                      </span>
                    ))}
                  </div>
                )}

                {user.bio && <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{user.bio}</p>}
                <div className="mt-1 flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => sayHi(user.id)}
                    className="self-start rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm"
                  >
                    {t("sendMessage")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => wave(user.id)}
                    disabled={waveStatus[user.id] === "sending" || waveStatus[user.id] === "sent"}
                    title={
                      waveStatus[user.id] === "sent"
                        ? tc("waveSent")
                        : waveStatus[user.id] === "cooldown"
                          ? tc("alreadyWaved")
                          : tc("wave")
                    }
                    className="self-start rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm transition disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800"
                  >
                    {waveStatus[user.id] === "sent" || waveStatus[user.id] === "cooldown" ? "✓ 👋" : "👋"}
                  </motion.button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </main>
  );
}
