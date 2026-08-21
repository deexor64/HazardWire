import { useState, useEffect, useCallback } from 'react'
import type { Report, ReportFilters } from '../types'
import { getReports } from '../api'
import { SEVERITY_BG, STATUS_BG, CATEGORY_ICON, formatDate } from '../utils'
import ReportCard from './ReportCard'

const CATEGORIES = ['road','drainage','water','electricity','garbage','environment','animals','accident','crime','other']
const SEVERITIES = ['critical','high','medium','low']
const STATUSES = ['pending','assigned','in_review','resolved']

export default function ReportsView() {
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Report | null>(null)
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, page_size: 20 })


  const load = useCallback(() => {
    setLoading(true)
    getReports(filters)
      .then((res: any) => { setReports(res.result.results); setTotal(res.result.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, [load])

  function setF(key: keyof ReportFilters, v: string | undefined) {
    setFilters(f => ({ ...f, [key]: v || undefined, page: 1 }))
  }

  function handleProximityChange(radius: string) {
    if (!radius) {
      setFilters(f => ({ ...f, lattitude: undefined, longitude: undefined, radius_km: undefined, page: 1 }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setFilters(f => ({
          ...f,
          lattitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          radius_km: parseFloat(radius),
          page: 1
        }))
      },
      err => alert('Could not get your location: ' + err.message)
    )
  }

  const totalPages = Math.ceil(total / (filters.page_size ?? 20))

  if (selected) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-orange-400 transition-colors mb-4"
        >
          ← Back to reports
        </button>
        <ReportDetail report={selected} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#2a2d3e]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Reports</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {loading ? 'Loading…' : <><span className="text-orange-400 font-semibold">{total}</span> total reports</>}
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs bg-[#1e2130] hover:bg-[#2a2d3e] border border-[#2a2d3e] rounded-lg px-3 py-2 text-slate-300 transition-colors"
          >
            {loading ? <span className="animate-spin">↺</span> : '↺'} Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input value={filters.title ?? ''} onChange={e => setF('title', e.target.value)}
            placeholder="Search title…"
            className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 w-32" />
          <select value={filters.category ?? ''} onChange={e => setF('category', e.target.value as any)}
            className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer">
            <option value="">Category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICON[c as any]} {c}</option>)}
          </select>
          <select value={filters.severity ?? ''} onChange={e => setF('severity', e.target.value as any)}
            className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer">
            <option value="">Severity</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.status ?? ''} onChange={e => setF('status', e.target.value as any)}
            className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer">
            <option value="">Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <select value={filters.radius_km ?? ''} onChange={e => handleProximityChange(e.target.value)}
            className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer">
            <option value="">Everywhere (Location)</option>
            <option value="1">Within 1 km</option>
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="50">Within 50 km</option>
          </select>
          <input value={filters.authority ?? ''} onChange={e => setF('authority', e.target.value)}
            placeholder="Authority…"
            className="text-xs bg-[#1e2130] border border-[#2a2d3e] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 w-28" />
          {Object.values(filters).some(Boolean) && (
            <button onClick={() => setFilters({ page: 1, page_size: 20 })}
              className="text-xs text-orange-400 hover:text-orange-300 px-2 transition-colors">
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && <LoadingGrid />}
        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-300 font-medium">No reports found</p>
            <p className="text-slate-500 text-sm">Adjust filters or submit the first report</p>
          </div>
        )}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reports.map(r => (
              <ReportCard key={r.id} report={r} onClick={() => setSelected(r)} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-4 border-t border-[#2a2d3e]">
          <button
            disabled={(filters.page ?? 1) <= 1}
            onClick={() => setFilters(f => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#1e2130] border border-[#2a2d3e] text-slate-300 disabled:opacity-40 hover:bg-[#2a2d3e] transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-400">
            Page <span className="text-orange-400 font-semibold">{filters.page}</span> of {totalPages}
          </span>
          <button
            disabled={(filters.page ?? 1) >= totalPages}
            onClick={() => setFilters(f => ({ ...f, page: Math.min(totalPages, (f.page ?? 1) + 1) }))}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#1e2130] border border-[#2a2d3e] text-slate-300 disabled:opacity-40 hover:bg-[#2a2d3e] transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

function ReportDetail({ report }: { report: Report }) {
  return (
    <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl overflow-hidden">
      <div className="h-1 w-full" style={{ background: getBg(report.severity) }} />
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{CATEGORY_ICON[report.category]}</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{report.title}</h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">ID: {report.id}</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">{report.description}</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" value={`${CATEGORY_ICON[report.category]} ${report.category}`} />
          <Field label="Severity" value={<span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full border ${SEVERITY_BG[report.severity]}`}>{report.severity}</span>} />
          <Field label="Status" value={<span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full border ${STATUS_BG[report.status]}`}>{report.status.replace('_',' ')}</span>} />
          {report.authority && <Field label="Authority" value={report.authority} />}
          {report.latitude && <Field label="Latitude" value={report.latitude.toFixed(6)} />}
          {report.longitude && <Field label="Longitude" value={report.longitude.toFixed(6)} />}
          <Field label="Submitted" value={formatDate(report.submitted_at)} />
          <Field label="Updated" value={formatDate(report.updated_at)} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="text-sm text-slate-200">{value}</div>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({length: 6}).map((_, i) => (
        <div key={i} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-4 animate-pulse">
          <div className="h-3 bg-[#2a2d3e] rounded w-3/4 mb-2" />
          <div className="h-2 bg-[#2a2d3e] rounded w-1/2 mb-4" />
          <div className="h-2 bg-[#2a2d3e] rounded w-full mb-2" />
          <div className="h-2 bg-[#2a2d3e] rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

function getBg(s: string) {
  const m: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }
  return m[s] ?? m.low
}
