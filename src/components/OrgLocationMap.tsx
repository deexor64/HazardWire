"use client";

import { useEffect, useRef } from "react";

type Props = {
  latitude: string;
  longitude: string;
};

export default function OrgLocationMap({ latitude, longitude }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);

  // Init map once (Leaflet loaded only in the browser)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function init() {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      const L = leaflet.default;

      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [7.8731, 80.7718],
        zoom: 7,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      mapRef.current = map;
    }

    void init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker when lat/lng change
  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    async function updateMarker() {
      const leaflet = await import("leaflet");
      const L = leaflet.default;

      if (cancelled || !mapRef.current) return;

      if (!hasPoint) {
        if (markerRef.current) {
          mapRef.current.removeLayer(markerRef.current);
          markerRef.current = null;
        }
        return;
      }

      const point = L.latLng(lat, lng);

      if (markerRef.current) {
        markerRef.current.setLatLng(point);
      } else {
        markerRef.current = L.circleMarker(point, {
          radius: 8,
          color: "#ea580c",
          fillColor: "#ea580c",
          fillOpacity: 0.9,
        }).addTo(mapRef.current);
      }

      mapRef.current.setView(point, 12);
    }

    void updateMarker();

    return () => {
      cancelled = true;
    };
  }, [lat, lng, hasPoint]);

  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-1.5">Location on map</p>
      <div
        ref={containerRef}
        className="h-48 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-100"
      />
      {!hasPoint && (
        <p className="text-xs text-slate-500 mt-1">
          Enter valid latitude and longitude to show the marker.
        </p>
      )}
    </div>
  );
}
