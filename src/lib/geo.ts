import { prisma } from "@/lib/prisma";

export type NearbyUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  distanceKm: number;
};

/**
 * Deterministically nudges a coordinate by up to ~600m, seeded by
 * the user's own id so the offset is stable across requests (their
 * pin doesn't visibly jump every time the map reloads) while still
 * never exposing their exact real coordinates to other users —
 * `distanceKm` above is computed from the REAL coordinates in SQL
 * before this runs, so the displayed distance stays accurate even
 * though the plotted pin is fuzzed.
 */
function seededOffset(seed: string): { dLat: number; dLng: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  // Two independent pseudo-random values in [-1, 1] from one seed.
  const r1 = (Math.sin(hash) * 10000) % 1;
  const r2 = (Math.sin(hash * 2.17 + 1) * 10000) % 1;
  const metersToDeg = 1 / 111_320; // ~ meters per degree latitude
  const maxMeters = 600;
  return {
    dLat: r1 * maxMeters * metersToDeg,
    dLng: r2 * maxMeters * metersToDeg,
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
  limit = 50
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

  const rows = await prisma.$queryRaw<NearbyUser[]>`
    SELECT
      "id",
      "username",
      "displayName",
      "avatarUrl",
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
    ORDER BY "distanceKm" ASC
    LIMIT ${limit};
  `;

  return rows
    .filter((r: NearbyUser) => r.distanceKm <= radiusKm)
    .map((r: NearbyUser) => {
      const { dLat, dLng } = seededOffset(r.id);
      return { ...r, latitude: r.latitude + dLat, longitude: r.longitude + dLng };
    });
}
