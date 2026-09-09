"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// react-leaflet-cluster bundles and imports its own copy of the
// leaflet.markercluster CSS internally — no separate import needed.
import { Link } from "@/i18n/navigation";
import VerifiedBadge from "@/components/profile/VerifiedBadge";

export type NearbyUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPremiumCached?: boolean;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

/**
 * HelloTalk-style pin: the user's own avatar photo in a round white
 * frame instead of a generic map pin. Falls back to their initial
 * when there's no photo.
 */
function avatarIcon(user: NearbyUser) {
  const initial = (user.displayName || user.username).slice(0, 1).toUpperCase();
  const inner = user.avatarUrl
    ? `<img src="${user.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`
    : `<div style="width:100%;height:100%;border-radius:9999px;background:#7c3aed;color:#fff;
         display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;">${initial}</div>`;
  return L.divIcon({
    className: "",
    html: `<div style="
        width:44px;height:44px;border-radius:9999px;background:#fff;
        border:3px solid #7c3aed;box-shadow:0 2px 8px rgba(0,0,0,.35);
        padding:2px;
      ">${inner}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -40],
  });
}

/** Cluster bubble shown while multiple nearby pins overlap at the current zoom. */
function clusterIcon(count: number) {
  const size = count > 99 ? 52 : count > 9 ? 46 : 40;
  return L.divIcon({
    className: "",
    html: `<div style="
        display:flex;align-items:center;justify-content:center;
        width:${size}px;height:${size}px;border-radius:9999px;
        background:#7c3aed;color:#fff;font-weight:700;font-size:14px;
        border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);
      ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

/**
 * Leaflet measures its container's size the moment it initializes —
 * if that happens while the tab is in the background, or before the
 * surrounding flex layout has settled to its final height, the
 * browser reports 0 (or a stale) size and Leaflet's internal tile
 * math gets stuck on it: the result is a map that renders zoomed
 * WAY out (a whole region instead of one city) even though `zoom`
 * is set correctly, and it doesn't self-correct just by switching
 * back to the tab. Re-measuring after mount, on next-tick, on tab
 * visibility, and on container resize fixes all of those cases.
 */
function InvalidateSizeFix() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const refresh = () => map.invalidateSize();

    const raf = requestAnimationFrame(refresh);
    const t1 = setTimeout(refresh, 300);
    const t2 = setTimeout(refresh, 1000);

    const ro = new ResizeObserver(refresh);
    ro.observe(container);

    function onVisibility() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [map]);
  return null;
}

export default function NearbyMap({
  center,
  users,
}: {
  center: { lat: number; lng: number };
  users: NearbyUser[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      // maxZoom matches the initial `zoom` above on purpose, per
      // explicit feedback: the opening city-wide view is already the
      // right amount of zoom, and shouldn't be possible to zoom in
      // past — not even to the "neighborhood" level the previous
      // maxZoom={15} still allowed. Pins are also fuzzed by up to
      // ~1.5km (see lib/geo.ts), but the map-level cap is what
      // actually guarantees nobody can zoom in further, regardless of
      // how the fuzz math is tuned.
      maxZoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
    >
      {/* OpenStreetMap tiles — free, no API key required. Please
          respect the OSM tile usage policy in production
          (https://operations.osmfoundation.org/policies/tiles/) —
          consider a paid tile provider (e.g. MapTiler, Stadia Maps)
          at real scale. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={12}
      />
      <InvalidateSizeFix />
      <Recenter lat={center.lat} lng={center.lng} />
      {/* HelloTalk-style behaviour: overlapping avatar pins merge into
          one numbered bubble; clicking a bubble zooms the map in
          (zoomToBoundsOnClick) until the pins are far enough apart to
          separate back into individual avatars. */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom
        zoomToBoundsOnClick
        iconCreateFunction={(cluster: { getChildCount: () => number }) =>
          clusterIcon(cluster.getChildCount())
        }
      >
        {users.map((u) => (
          <Marker key={u.id} position={[u.latitude, u.longitude]} icon={avatarIcon(u)}>
            <Popup>
              <Link href={`/profile/${u.username}`} className="flex items-center gap-2 text-sm">
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {(u.displayName || u.username).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {u.displayName || u.username}
                    {u.isPremiumCached && <VerifiedBadge size="sm" />}
                  </p>
                  <p className="text-xs text-gray-500">{u.distanceKm.toFixed(1)} km</p>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
