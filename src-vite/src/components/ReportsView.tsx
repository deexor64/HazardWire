import { useState, useEffect } from 'react'
import { getReports } from '../api'

export default function ReportsView() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    getReports()
      .then((res: any) => {
        setReports(res.result?.results || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (selected) {
    return (
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1"
        >
          ← Back to all reports
        </button>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
            <h2 className="font-semibold text-slate-800 leading-snug">
              {selected.title}
            </h2>
            <StatusBadge status={selected.status} />
          </div>

          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              {selected.description}
            </p>

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

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading reports…
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm">No reports found yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full text-left bg-white border border-slate-200 rounded-xl p-4
                         hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium text-slate-800 leading-snug">
                  {r.title}
                </h2>
                <StatusBadge status={r.status} />
              </div>

              <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">
                {r.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-slate-400">
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
            </button>
          ))}
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
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize shrink-0 ${style}`}
    >
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
