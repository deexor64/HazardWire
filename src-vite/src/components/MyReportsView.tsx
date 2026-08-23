import { useState } from 'react'
import { getReportByToken } from '../api'

export default function MyReportsView() {
  const [token, setToken] = useState('')
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    if (!token.trim()) {
      setError('Please enter your token')
      return
    }

    setLoading(true)
    setError('')
    setReport(null)

    try {
      const res: any = await getReportByToken(token.trim())
      setReport(res.result)
    } catch (e: any) {
      setError(e.message || 'Report not found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6">My Report</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Private Access Token</label>
        <div className="flex gap-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your token here"
            className="input-base flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Find'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {report && (
        <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold">{report.title}</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
              {report.status}
            </span>
          </div>

          <p className="text-gray-600 text-sm">{report.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Category</span>
              <p className="font-medium capitalize">{report.category || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Severity</span>
              <p className="font-medium capitalize">{report.severity || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Submitted</span>
              <p className="font-medium">
                {report.submitted_at ? new Date(report.submitted_at).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Location</span>
              <p className="font-medium">
                {report.latitude ? `${report.latitude}, ${report.longitude}` : '—'}
              </p>
            </div>
          </div>

          {report.ai_analysis && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
              <p className="text-gray-500 mb-1">AI Analysis</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(report.ai_analysis, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
