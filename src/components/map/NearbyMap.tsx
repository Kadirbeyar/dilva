"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@/i18n/navigation";

export type NearbyClusterMember = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  distanceKm: number;
};

export type NearbyCityCluster = {
  key: string;
  city: string;
  country: string | null;
  lat: number;
  lng: number;
  count: number;
  members: NearbyClusterMember[];
};

/**
 * One pin per CITY, not one per user: the map never plots anyone's
 * exact coordinates. A pin sits at the average position of its
 * city's members and shows a count badge; clicking it flies the map
 * in and opens the full member list (avatars + distance) instead of
 * ever revealing a precise home location.
 */
function cityIcon(count: number) {
  return L.divIcon({
    className: "",
    html: `<div style="
        display:flex;align-items:center;justify-content:center;
        width:${count > 9 ? 40 : 34}px;height:${count > 9 ? 40 : 34}px;
        border-radius:9999px;background:#7c3aed;color:#fff;
        font-weight:700;font-size:13px;border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,.35);
      ">${count}</div>`,
    iconSize: [count > 9 ? 40 : 34, count > 9 ? 40 : 34],
    iconAnchor: [count > 9 ? 20 : 17, count > 9 ? 20 : 17],
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function FlyTo({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [target, map]);
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
  clusters,
}: {
  center: { lat: number; lng: number };
  clusters: NearbyCityCluster[];
}) {
  const [mounted, setMounted] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
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
      />
      <InvalidateSizeFix />
      <Recenter lat={center.lat} lng={center.lng} />
      <FlyTo target={flyTarget} />
      {clusters.map((c) => (
        <Marker
          key={c.key}
          position={[c.lat, c.lng]}
          icon={cityIcon(c.count)}
          eventHandlers={{
            click: () => setFlyTarget({ lat: c.lat, lng: c.lng }),
          }}
        >
          <Popup minWidth={220} maxHeight={280}>
            <div className="text-sm">
              <p className="mb-2 font-semibold">
                {c.city} · {c.count}
              </p>
              <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                {c.members.map((m) => (
                  <Link
                    key={m.id}
                    href={`/profile/${m.username}`}
                    className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-gray-100"
                  >
                    {m.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {(m.displayName || m.username).slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-800">
                        {m.displayName || m.username}
                      </p>
                      <p className="text-[11px] text-gray-500">{m.distanceKm.toFixed(1)} km</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
