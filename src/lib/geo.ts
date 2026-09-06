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
 * A group of nearby users bucketed by city, for privacy: the map
 * shows one pin per city (at the average position of that city's
 * members, not any individual's exact coordinates) instead of
 * plotting everyone's precise home location. Clicking the pin
 * reveals the member list (avatars + distance) without exposing
 * per-user coordinates to the client at all.
 */
export type NearbyCityCluster = {
  key: string;
  city: string;
  country: string | null;
  lat: number;
  lng: number;
  count: number;
  members: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    distanceKm: number;
  }[];
};

/** Groups flat nearby-user rows into per-city clusters (see NearbyCityCluster). */
export function clusterByCity(users: NearbyUser[]): NearbyCityCluster[] {
  const groups = new Map<string, NearbyUser[]>();
  for (const u of users) {
    const key = `${u.city ?? "?"}__${u.country ?? "?"}`;
    const list = groups.get(key);
    if (list) list.push(u);
    else groups.set(key, [u]);
  }

  const clusters: NearbyCityCluster[] = [];
  for (const [key, members] of groups) {
    const avgLat = members.reduce((sum, m) => sum + m.latitude, 0) / members.length;
    const avgLng = members.reduce((sum, m) => sum + m.longitude, 0) / members.length;
    clusters.push({
      key,
      city: members[0].city || members[0].country || "?",
      country: members[0].country,
      lat: avgLat,
      lng: avgLng,
      count: members.length,
      members: members
        .map((m) => ({
          id: m.id,
          username: m.username,
          displayName: m.displayName,
          avatarUrl: m.avatarUrl,
          distanceKm: m.distanceKm,
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm),
    });
  }

  return clusters.sort((a, b) => a.members[0].distanceKm - b.members[0].distanceKm);
}

/**
 * Premium "Nearby" feature. Uses a plain Haversine-distance query —
 * intentionally NOT PostGIS, so this works on a stock Supabase
 * Postgres database with zero extra extensions (pairs with the
 * OpenStreetMap/Leaflet map on the frontend, no paid geocoding
 * service required either).
 *
 * Only returns users who have explicitly opted in with
 * isLocationVisible = true.
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

  return rows.filter((r: NearbyUser) => r.distanceKm <= radiusKm);
}
