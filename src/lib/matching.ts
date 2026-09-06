import { prisma } from "@/lib/prisma";
import { latestBirthDateForMinAge } from "@/lib/age";
import { onlineWhere } from "@/lib/presence";
import type { Gender } from "@prisma/client";

export type SearchFilters = {
  minAge?: number;
  maxAge?: number;
  gender?: Gender;
  languageCode?: string;
};

export type MatchFilters = SearchFilters & {
  country?: string;
  onlineOnly?: boolean;
  limit?: number;
  cursor?: string;
};

export type MatchResult = {
  user: Awaited<ReturnType<typeof prisma.user.findMany>>[number] & {
    languages: { languageCode: string; type: string; proficiency: string | null }[];
  };
  /** 2 = mutual exchange (they teach what I'm learning AND learn what I know), 1 = one-directional */
  matchScore: 1 | 2;
};

/** Shared birthDate/gender/language `where` clauses for the Premium search filters. */
function buildSearchWhere(filters: SearchFilters) {
  const where: Record<string, unknown> = {};

  if (filters.minAge != null) {
    where.birthDate = {
      ...(where.birthDate as object),
      lte: latestBirthDateForMinAge(filters.minAge),
    };
  }
  if (filters.maxAge != null) {
    // "at most maxAge" ⇒ born after (today - (maxAge + 1) years), i.e.
    // strictly younger than someone who just turned maxAge + 1.
    where.birthDate = {
      ...(where.birthDate as object),
      gt: latestBirthDateForMinAge(filters.maxAge + 1),
    };
  }
  if (filters.gender) {
    where.gender = filters.gender;
  }
  if (filters.languageCode) {
    where.languages = { some: { languageCode: filters.languageCode } };
  }

  return where;
}

async function getExcludedIds(userId: string): Promise<Set<string>> {
  // Sequential, not Promise.all: Dilva's DB connection goes through
  // Supabase's pooler with connection_limit=1 — firing both at once
  // doesn't parallelize, it just queues them and makes pool-timeout
  // errors (which searchUsersByName/findLanguagePartners/browseAllUsers
  // silently turned into "no results") more likely under load.
  const blockedByMe = await prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } });
  const blockedMe = await prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } });
  return new Set<string>([
    userId,
    ...blockedByMe.map((b: (typeof blockedByMe)[number]) => b.blockedId),
    ...blockedMe.map((b: (typeof blockedMe)[number]) => b.blockerId),
  ]);
}

/**
 * Dilva's Language Matching Engine.
 *
 * Mirrors HelloTalk's core idea: surface people whose NATIVE language
 * is one I'm LEARNING, and who are themselves LEARNING a language I'm
 * NATIVE in. Perfect mutual matches (both directions) are ranked above
 * one-directional ones. A user can be NATIVE/LEARNING in several
 * languages at once (up to 4 target languages), so this already works
 * across all of them — any overlap on either side counts.
 */
export async function findLanguagePartners(
  userId: string,
  filters: MatchFilters = {}
): Promise<MatchResult[]> {
  const { country, onlineOnly, limit = 30, cursor } = filters;

  const myLanguages = await prisma.userLanguage.findMany({
    where: { userId },
    select: { languageCode: true, type: true },
  });

  const myNativeCodes = myLanguages
    .filter((l: (typeof myLanguages)[number]) => l.type === "NATIVE")
    .map((l: (typeof myLanguages)[number]) => l.languageCode);
  const myTargetCodes = myLanguages
    .filter((l: (typeof myLanguages)[number]) => l.type === "LEARNING")
    .map((l: (typeof myLanguages)[number]) => l.languageCode);

  if (myNativeCodes.length === 0 || myTargetCodes.length === 0) {
    return [];
  }

  const excludedIds = await getExcludedIds(userId);

  // Direction A: candidates who natively speak a language I'm learning
  // (they can teach/correct me).
  const canTeachMe = await prisma.userLanguage.findMany({
    where: { type: "NATIVE", languageCode: { in: myTargetCodes } },
    select: { userId: true },
  });

  // Direction B: candidates who are learning a language I natively speak
  // (I can teach/correct them).
  const iCanTeach = await prisma.userLanguage.findMany({
    where: { type: "LEARNING", languageCode: { in: myNativeCodes } },
    select: { userId: true },
  });

  const scoreByUser = new Map<string, number>();
  for (const { userId: uid } of canTeachMe) {
    if (excludedIds.has(uid)) continue;
    scoreByUser.set(uid, (scoreByUser.get(uid) ?? 0) + 1);
  }
  for (const { userId: uid } of iCanTeach) {
    if (excludedIds.has(uid)) continue;
    scoreByUser.set(uid, (scoreByUser.get(uid) ?? 0) + 1);
  }

  if (scoreByUser.size === 0) return [];

  const candidateIds = [...scoreByUser.keys()];

  const users = await prisma.user.findMany({
    where: {
      id: { in: candidateIds },
      ...(country ? { country } : {}),
      ...(onlineOnly ? onlineWhere() : {}),
      ...buildSearchWhere(filters),
    },
    include: {
      languages: {
        select: { languageCode: true, type: true, proficiency: true },
      },
    },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ isOnline: "desc" }, { lastSeenAt: "desc" }],
  });

  return users
    .map((user: (typeof users)[number]) => ({
      user,
      matchScore: (scoreByUser.get(user.id) === 2 ? 2 : 1) as 1 | 2,
    }))
    .sort((a: { matchScore: number }, b: { matchScore: number }) => b.matchScore - a.matchScore);
}

/**
 * Search by username/display name — deliberately ignores the
 * matching engine's language-overlap gate and the "matches" vs
 * "browse all" mode entirely: when someone types a name they want
 * to find that PERSON, not just the subset who happen to share a
 * language with them. Still respects blocks and other active filters
 * (country/online/premium age-gender-language) since those are
 * genuine preferences, not the matching restriction.
 */
export async function searchUsersByName(
  userId: string,
  query: string,
  filters: MatchFilters = {}
): Promise<MatchResult[]> {
  const { country, onlineOnly, limit = 30, cursor } = filters;
  const excludedIds = await getExcludedIds(userId);
  const q = query.trim();
  if (!q) return [];

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: [...excludedIds] },
      username: { not: "" },
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ],
      ...(country ? { country } : {}),
      ...(onlineOnly ? onlineWhere() : {}),
      ...buildSearchWhere(filters),
    },
    include: {
      languages: {
        select: { languageCode: true, type: true, proficiency: true },
      },
    },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ isOnline: "desc" }, { lastSeenAt: "desc" }],
  });

  return users.map((user: (typeof users)[number]) => ({ user, matchScore: 1 as const }));
}

/**
 * "Browse everyone" — the non-matching-engine list a user can switch
 * to from the Matches page, so language overlap isn't a hard gate.
 */
export async function browseAllUsers(
  userId: string,
  filters: MatchFilters = {}
): Promise<MatchResult[]> {
  const { country, onlineOnly, limit = 30, cursor } = filters;
  const excludedIds = await getExcludedIds(userId);

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: [...excludedIds] },
      username: { not: "" },
      ...(country ? { country } : {}),
      ...(onlineOnly ? onlineWhere() : {}),
      ...buildSearchWhere(filters),
    },
    include: {
      languages: {
        select: { languageCode: true, type: true, proficiency: true },
      },
    },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ isOnline: "desc" }, { lastSeenAt: "desc" }],
  });

  return users.map((user: (typeof users)[number]) => ({ user, matchScore: 1 as const }));
}
