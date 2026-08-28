"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  latitude: string;
  longitude: string;
};

export default function OrgLocationMap({ latitude, longitude }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [7.8731, 80.7718],
      zoom: 7,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hasPoint) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
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
      }).addTo(map);
    }

    map.setView(point, 12);
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
