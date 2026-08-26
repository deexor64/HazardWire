'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getReports } from '@/lib/api'

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
  unknown: '#64748b',
}

function createMarkerSvg(severity: string | null) {
  const color = SEVERITY_COLORS[severity || 'unknown'] || SEVERITY_COLORS.unknown
  return `
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>
  `
}

export default function MapViewInner() {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [7.8731, 80.7718],
      zoom: 8,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Fetch reports
  useEffect(() => {
    setLoading(true)
    getReports({ page_size: 100 })
      .then((res: any) => {
        setReports(res.result?.results || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Draw markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return

      const icon = L.divIcon({
        html: createMarkerSvg(report.severity),
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      })

      const marker = L.marker([report.latitude, report.longitude], { icon })
        .addTo(map)
        .on('click', () => setSelected(report))

      markersRef.current.push(marker)
    })
  }, [reports])

  return (
    <div className="relative h-full w-full">
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 shadow-sm">
          Loading reports…
        </div>
      )}

      {/* Map container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Selected report card */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-center">
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-w-md w-full p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold text-slate-800 leading-snug">
                {selected.title}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
              {selected.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <StatusBadge status={selected.status} />
              <span className="text-slate-400 capitalize">
                {selected.category || 'Uncategorized'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 capitalize">
                {selected.severity || 'Unknown'} severity
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Simple legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-slate-200 rounded-lg px-3 py-2 shadow-sm hidden sm:block">
        <p className="text-[10px] font-medium text-slate-500 mb-1.5">Severity</p>
        <div className="flex flex-col gap-1">
          {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-slate-600 capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    analyzing: 'bg-sky-50 text-sky-700 border-sky-200',
    assigned: 'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  const style = styles[status] || styles.pending

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${style}`}>
      {status?.replace('_', ' ') || 'Unknown'}
    </span>
  )
}
