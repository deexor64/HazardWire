import { useState, useEffect } from 'react'
import { getReports, getReportUpdates } from '../api'

const CATEGORIES = [
  'road', 'water', 'electricity', 'garbage',
  'drainage', 'environment', 'other'
]

const STATUSES = [
  'pending', 'assigned', 'in_progress', 'resolved', 'closed'
]

export default function ReportsView() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')

  function loadReports() {
    setLoading(true)
    setError('')

    const filters: any = { page_size: 50 }
    if (category) filters.category = category
    if (status) filters.status = status

    getReports(filters)
      .then((res: any) => {
        setReports(res.result?.results || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReports()
  }, [category, status])

  if (selected) {
    const images = selected.media_urls?.length
      ? selected.media_urls
      : selected.raw_media_urls || []

    return (
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-slate-500 hover:text-slate-800 mb-4"
        >
          ← Back to all reports
        </button>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
            <h2 className="font-semibold text-slate-800">{selected.title}</h2>
            <StatusBadge status={selected.status} />
          </div>

          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-slate-600">{selected.description}</p>

            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-28 rounded-lg object-cover border border-slate-200"
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="Category" value={selected.category || '—'} />
              <InfoItem label="Severity" value={selected.severity || '—'} />
              <InfoItem
                label="Submitted"
                value={
                  selected.submitted_at
                    ? new Date(selected.submitted_at).toLocaleString()
                    : '—'
                }
              />
              <InfoItem
                label="Location"
                value={
                  selected.latitude
                    ? `${selected.latitude}, ${selected.longitude}`
                    : 'Not provided'
                }
              />
            </div>

            <ReportUpdates reportId={selected.id} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">All Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Public list of reported hazards across the country.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        {(category || status) && (
          <button
            onClick={() => {
              setCategory('')
              setStatus('')
            }}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">No reports found.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const images = r.media_urls?.length ? r.media_urls : r.raw_media_urls || []
            const thumb = images[0] || null

            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300"
              >
                <div className="flex gap-3">
                  {thumb && (
                    <img
                      src={thumb}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover border border-slate-100 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-medium text-slate-800">{r.title}</h2>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                    <div className="flex flex-wrap gap-x-3 mt-2 text-xs text-slate-400">
                      <span className="capitalize">{r.category || 'Uncategorized'}</span>
                      <span>·</span>
                      <span className="capitalize">{r.severity || 'Unknown'}</span>
                      <span>·</span>
                      <span>
                        {r.submitted_at
                          ? new Date(r.submitted_at).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
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
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize shrink-0 ${style}`}>
      {status?.replace('_', ' ') || 'Unknown'}
    </span>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="font-medium text-slate-800 capitalize">{value}</p>
    </div>
  )
}

function ReportUpdates({ reportId }: { reportId: string }) {
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReportUpdates(reportId)
      .then((res: any) => setUpdates(res.result || []))
      .catch(() => setUpdates([]))
      .finally(() => setLoading(false))
  }, [reportId])

  if (loading) {
    return <p className="text-xs text-slate-400 pt-3">Loading updates…</p>
  }

  if (updates.length === 0) {
    return (
      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-400">No updates from authorities yet.</p>
      </div>
    )
  }

  return (
    <div className="pt-4 border-t border-slate-100">
      <p className="text-xs font-medium text-slate-500 mb-3">Updates from authorities</p>
      <div className="space-y-3">
        {updates.map((u) => (
          <div key={u.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <StatusBadge status={u.status || 'updated'} />
              <span className="text-[11px] text-slate-400">
                {u.created_at ? new Date(u.created_at).toLocaleString() : ''}
              </span>
            </div>
            {u.comment && (
              <p className="text-sm text-slate-600 mt-1">{u.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
