import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { findLanguagePartners, browseAllUsers, searchUsersByName, type SearchFilters } from "@/lib/matching";
import { isPremiumUser } from "@/lib/premium";
import { computeIsOnline } from "@/lib/presence";
import type { Gender } from "@prisma/client";

const VALID_GENDERS = new Set(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]);

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);

    // Age/gender/language search filters are a Premium feature — the
    // UI shows them to everyone but only sends them once the viewer
    // is Premium; we also re-check server-side so the restriction
    // can't be bypassed by calling the API directly.
    const premium = await isPremiumUser(user.id);
    const searchFilters: SearchFilters = {};
    if (premium) {
      const minAge = searchParams.get("minAge");
      const maxAge = searchParams.get("maxAge");
      const gender = searchParams.get("gender");
      const languageCode = searchParams.get("languageCode");
      if (minAge) searchFilters.minAge = Number(minAge);
      if (maxAge) searchFilters.maxAge = Number(maxAge);
      if (gender && VALID_GENDERS.has(gender)) searchFilters.gender = gender as Gender;
      if (languageCode) searchFilters.languageCode = languageCode;
    }

    const mode = searchParams.get("mode") === "all" ? "all" : "matches";
    const q = searchParams.get("q")?.trim() ?? "";
    // Picking a specific country is also Premium-only — "any country"
    // (no value at all) stays free for everyone. Same re-check
    // pattern as the age/gender/language filters above: the UI only
    // lets a non-Premium viewer send this once they've upgraded, and
    // this is the server-side backstop.
    const requestedCountry = searchParams.get("country") ?? undefined;
    const commonFilters = {
      country: premium ? requestedCountry : undefined,
      onlineOnly: searchParams.get("online") === "true",
      cursor: searchParams.get("cursor") ?? undefined,
      ...searchFilters,
    };

    // A name search overrides mode entirely — see searchUsersByName's
    // doc comment for why: typing a name means "find that person",
    // not "find that person only if we're a language match".
    const results = q
      ? await searchUsersByName(user.id, q, commonFilters)
      : mode === "all"
        ? await browseAllUsers(user.id, commonFilters)
        : await findLanguagePartners(user.id, commonFilters);

    return NextResponse.json({
      mode: q ? "search" : mode,
      premiumFiltersApplied: premium && (Object.keys(searchFilters).length > 0 || Boolean(commonFilters.country)),
      results: results.map((r) => ({
        matchScore: r.matchScore,
        user: {
          id: r.user.id,
          username: r.user.username,
          displayName: r.user.displayName,
          avatarUrl: r.user.avatarUrl,
          bio: r.user.bio,
          country: r.user.country,
          city: r.user.city,
          isOnline: computeIsOnline(r.user),
          isPremium: r.user.isPremiumCached,
          birthDate: r.user.birthDate,
          gender: r.user.gender,
          languages: r.user.languages,
        },
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[matches]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
