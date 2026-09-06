"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icons reference image files by relative
// path, which breaks under bundlers — point them at the CDN instead.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export type NearbyUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
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
      <Recenter lat={center.lat} lng={center.lng} />
      {users.map((u) => (
        <Marker key={u.id} position={[u.latitude, u.longitude]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{u.displayName || u.username}</p>
              <p className="text-xs text-gray-500">{u.distanceKm.toFixed(1)} km</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
