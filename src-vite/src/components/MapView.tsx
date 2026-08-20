import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Report, ReportFilters, ReportSeverity } from '../types'
import { getReports } from '../api'
import { SEVERITY_COLOR, CATEGORY_ICON, SEVERITY_BG, STATUS_BG, relativeTime, createMarkerIcon } from '../utils'
import ReportCard from './ReportCard'

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

const CATEGORY_OPTIONS = ['road','drainage','water','electricity','garbage','environment','animals','accident','crime','other'] as const
const SEVERITY_OPTIONS = ['critical','high','medium','low'] as const

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Report | null>(null)
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, page_size: 100 })
  const [filterOpen, setFilterOpen] = useState(false)

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: [7.8731, 80.7718], // Sri Lanka centroid
      zoom: 8,
      zoomControl: true,
    })
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19, subdomains: 'abcd' }).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Fetch reports whenever filters change
  useEffect(() => {
    setLoading(true)
    getReports(filters)
      .then(res => {
        setReports(res.data.results)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filters])

  // Sync markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    reports.forEach(report => {
      if (!report.latitude || !report.longitude) return
      const svgStr = createMarkerIcon(report.severity)
      const icon = L.divIcon({
        html: svgStr,
        className: '',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -44],
      })
      const marker = L.marker([report.latitude, report.longitude], { icon })
        .addTo(map)
        .on('click', () => setSelected(report))

      // Tooltip
      marker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;min-width:160px">
          <div style="font-weight:600;font-size:13px;color:#f1f5f9;margin-bottom:4px">${CATEGORY_ICON[report.category]} ${report.title}</div>
          <div style="font-size:11px;color:#94a3b8">${report.severity.toUpperCase()} • ${report.status.replace('_',' ').toUpperCase()}</div>
        </div>`,
        { direction: 'top', className: '', offset: [0, -8] }
      )
      markersRef.current.push(marker)
    })
  }, [reports])

  function setFilter(key: keyof ReportFilters, value: string | undefined) {
    setFilters(f => ({ ...f, [key]: value || undefined, page: 1 }))
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Filter bar */}
      <div className="relative z-20 flex items-center gap-2 px-4 py-3 border-b border-[#2a2d3e] bg-[#13151f]/95 backdrop-blur-sm">
        <span className="text-xs text-slate-400 mr-1 font-medium">FILTER</span>

        {/* Category */}
        <select
          value={filters.category ?? ''}
          onChange={e => setFilter('category', e.target.value as any)}
          className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-1.5 text-slate-200 cursor-pointer focus:outline-none focus:border-orange-500"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{CATEGORY_ICON[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>

        {/* Severity */}
        <select
          value={filters.severity ?? ''}
          onChange={e => setFilter('severity', e.target.value as any)}
          className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-1.5 text-slate-200 cursor-pointer focus:outline-none focus:border-orange-500"
        >
          <option value="">All Severities</option>
          {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        {/* Status */}
        <select
          value={filters.status ?? ''}
          onChange={e => setFilter('status', e.target.value as any)}
          className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-1.5 text-slate-200 cursor-pointer focus:outline-none focus:border-orange-500"
        >
          <option value="">All Statuses</option>
          {['pending','assigned','in_review','resolved'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>

        {/* Authority */}
        <input
          placeholder="Authority (e.g. RDA)"
          value={filters.authority ?? ''}
          onChange={e => setFilter('authority', e.target.value)}
          className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 w-36"
        />

        <div className="ml-auto flex items-center gap-2">
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-orange-400">
              <div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          )}
          {!loading && (
            <span className="text-xs text-slate-400">
              <span className="text-orange-400 font-semibold">{total}</span> reports
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#2a2d3e]">
          {(['critical','high','medium','low'] as ReportSeverity[]).map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEVERITY_COLOR[s] }} />
              <span className="text-[10px] text-slate-400 capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div ref={containerRef} className="flex-1 z-0" />

      {/* No results overlay */}
      {!loading && reports.length === 0 && (
        <div className="absolute inset-0 top-14 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-[#1a1d2e]/90 backdrop-blur-sm border border-[#2a2d3e] rounded-2xl px-8 py-6 text-center">
            <div className="text-3xl mb-2">📍</div>
            <p className="text-slate-300 font-medium">No reports found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        </div>
      )}

      {/* Selected report panel */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          <div className="max-w-xl mx-auto">
            <ReportCard report={selected} onClose={() => setSelected(null)} expanded />
          </div>
        </div>
      )}
    </div>
  )
}
