import { prisma } from "@/lib/prisma";

export type NearbyUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPremiumCached: boolean;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  distanceKm: number;
};

// How far a pin can be nudged from someone's real coordinates. 600m
// (the original value) turned out to be too small once combined with
// the map's default max zoom: zoomed all the way in, a pin still
// landed close enough to look like it was pointing at one specific
// house — which is exactly the "100% exact home location" bug this
// was supposed to prevent. 1.5km keeps someone genuinely within "the
// same part of the city" for matching purposes without being
// pinpoint-able, and NearbyMap.tsx additionally caps how far the map
// can be zoomed in, as defense in depth on top of this.
const MAX_FUZZ_METERS = 1500;

/**
 * Deterministically nudges a coordinate by up to MAX_FUZZ_METERS,
 * seeded by the user's own id so the offset is stable across requests
 * (their pin doesn't visibly jump every time the map reloads) while
 * still never exposing their exact real coordinates to other users —
 * `distanceKm` above is computed from the REAL coordinates in SQL
 * before this runs, so the displayed distance stays accurate even
 * though the plotted pin is fuzzed.
 *
 * Picks a uniformly-random point inside a disc (random angle + a
 * sqrt-weighted radius, not a random lat/lng square) so the fuzzed
 * pin isn't visibly biased toward the seed's original position, and
 * corrects longitude by cos(latitude) since degrees of longitude
 * shrink the further from the equator you are — without that
 * correction the fuzz circle would stretch into an oval.
 */
function seededOffset(seed: string, latitude: number): { dLat: number; dLng: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  // Two independent pseudo-random values in [0, 1) from one seed.
  const r1 = Math.abs(Math.sin(hash) * 43758.5453) % 1;
  const r2 = Math.abs(Math.sin(hash * 2.17 + 1) * 12345.6789) % 1;

  const angle = r1 * 2 * Math.PI;
  const radiusMeters = MAX_FUZZ_METERS * Math.sqrt(r2);

  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((latitude * Math.PI) / 180);

  return {
    dLat: (radiusMeters * Math.sin(angle)) / metersPerDegreeLat,
    dLng: (radiusMeters * Math.cos(angle)) / metersPerDegreeLng,
  };
}

/**
 * Premium "Nearby" feature. Uses a plain Haversine-distance query —
 * intentionally NOT PostGIS, so this works on a stock Supabase
 * Postgres database with zero extra extensions (pairs with the
 * OpenStreetMap/Leaflet map on the frontend, no paid geocoding
 * service required either).
 *
 * Only returns users who have explicitly opted in with
 * isLocationVisible = true. Coordinates are fuzzed with a stable
 * per-user offset before being returned — see seededOffset above —
 * so nobody's exact home location is ever sent to the client; the
 * map (HelloTalk-style) clusters/un-clusters these fuzzed pins by
 * zoom level on the frontend.
 */
export async function findNearbyUsers(
  userId: string,
  radiusKm = 50,
  limit = 50,
  gender?: string | null
): Promise<NearbyUser[]> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { latitude: true, longitude: true },
  });

  if (me?.latitude == null || me?.longitude == null) {
    throw new Error("Current user has no location set");
  }

  // Sequential, not Promise.all: Dilva's DB connection goes through
  // Supabase's pooler with connection_limit=1 — firing both at once
  // doesn't parallelize, it just queues them and risks a pool-timeout
  // (P2024) that fails the whole /api/nearby request. That 500 is
  // exactly what made the Premium map look broken — the frontend
  // (nearby/page.tsx) turns any non-2xx response into a generic error
  // screen instead of showing the map.
  const blockedByMe = await prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } });
  const blockedMe = await prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } });
  const excluded = [
    userId,
    ...blockedByMe.map((b: { blockedId: string }) => b.blockedId),
    ...blockedMe.map((b: { blockerId: string }) => b.blockerId),
  ];
  // Cast both sides to text rather than the "Gender" enum type so a
  // null filter (show everyone) and a real value both work through the
  // same tagged-template parameter without needing Prisma.sql to
  // conditionally splice the clause in/out.
  const genderFilter = gender ?? null;

  const rows = await prisma.$queryRaw<NearbyUser[]>`
    SELECT
      "id",
      "username",
      "displayName",
      "avatarUrl",
      "isPremiumCached",
      "latitude",
      "longitude",
      "city",
      "country",
      (
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(${me.latitude})) * cos(radians("latitude")) *
            cos(radians("longitude") - radians(${me.longitude})) +
            sin(radians(${me.latitude})) * sin(radians("latitude"))
          ))
        )
      ) AS "distanceKm"
    FROM "users"
    WHERE
      "isLocationVisible" = true
      AND "latitude" IS NOT NULL
      AND "longitude" IS NOT NULL
      AND NOT ("id" = ANY(${excluded}::uuid[]))
      AND (${genderFilter}::text IS NULL OR "gender"::text = ${genderFilter}::text)
    ORDER BY "distanceKm" ASC
    LIMIT ${limit};
  `;

  return rows
    .filter((r: NearbyUser) => r.distanceKm <= radiusKm)
    .map((r: NearbyUser) => {
      const { dLat, dLng } = seededOffset(r.id, r.latitude);
      return { ...r, latitude: r.latitude + dLat, longitude: r.longitude + dLng };
    });
}
