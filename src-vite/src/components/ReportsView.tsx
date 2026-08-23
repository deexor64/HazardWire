import { useState, useEffect } from 'react'
import { getReports } from '../api'

export default function ReportsView() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getReports()
      .then((res: any) => {
        setReports(res.result?.results || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading reports...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-6">All Reports ({reports.length})</h1>

      {reports.length === 0 ? (
        <p className="text-gray-500">No reports found.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <h2 className="font-semibold text-gray-900">{r.title}</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize shrink-0">
                  {r.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.description}</p>

              <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-3">
                <span className="capitalize">{r.category || '—'}</span>
                <span>·</span>
                <span className="capitalize">{r.severity || '—'}</span>
                <span>·</span>
                <span>
                  {r.submitted_at
                    ? new Date(r.submitted_at).toLocaleString()
                    : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
