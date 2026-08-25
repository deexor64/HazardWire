import { useEffect, useState } from 'react'
import { getReportByToken, getReportUpdates } from '../api'


export default function MyReportsView() {
  const [token, setToken] = useState('')
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    if (!token.trim()) {
      setError('Please enter your access token.')
      return
    }

    setLoading(true)
    setError('')
    setReport(null)

    try {
      const res: any = await getReportByToken(token.trim())
      setReport(res.result)
    } catch (e: any) {
      setError(e.message || 'Report not found. Please check your token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">My Report</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter the private access token you received when you submitted the report.
        </p>
      </div>

      {/* Token Input */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Access Token
        </label>
        <div className="flex gap-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your token here"
            className="input-base flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg
                       hover:bg-slate-700 disabled:opacity-50 shrink-0"
          >
            {loading ? 'Checking…' : 'Find Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Report Result */}
      {report && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
            <h2 className="font-semibold text-slate-800 leading-snug">
              {report.title}
            </h2>
            <StatusBadge status={report.status} />
          </div>

          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              {report.description}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="Category" value={report.category || '—'} />
              <InfoItem label="Severity" value={report.severity || '—'} />
              <InfoItem
                label="Submitted"
                value={
                  report.submitted_at
                    ? new Date(report.submitted_at).toLocaleString()
                    : '—'
                }
              />
              <InfoItem
                label="Location"
                value={
                  report.latitude
                    ? `${report.latitude}, ${report.longitude}`
                    : 'Not provided'
                }
              />
            </div>

            {/* AI Analysis */}
            {report.ai_analysis && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1.5">System analysis</p>
                <p className="text-sm text-slate-600">
                  {report.ai_analysis.summary || '—'}
                </p>
                {report.ai_analysis.cleaned_description &&
                  report.ai_analysis.cleaned_description !== report.description && (
                    <p className="text-sm text-slate-500 mt-2">
                      {report.ai_analysis.cleaned_description}
                    </p>
                  )}
              </div>
            )}

            {/* Updates / Comments */}
            <ReportUpdates reportId={report.id} />
          </div>
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
