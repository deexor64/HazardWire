import { useState, useEffect } from 'react'
import { getPublicOrganizations } from '../api'

export default function AuthoritiesView() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    getPublicOrganizations()
      .then((res: any) => setOrgs(res.result || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Authorities</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered organisations that handle hazard reports.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Loading…</div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          No organisations registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => setSelected(org)}
              className="text-left bg-white border border-slate-200 rounded-xl p-4
                         hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-medium text-slate-800 leading-snug">
                  {org.name || 'Unnamed Organisation'}
                </h2>
                {org.verified ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
                                   bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
                                   bg-slate-50 text-slate-500 border border-slate-200 shrink-0">
                    Unverified
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500 capitalize mb-1">
                {org.authority_type || 'General'}
              </p>

              {org.phone && (
                <p className="text-sm text-slate-600">{org.phone}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail popup */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-lg">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {selected.name || 'Unnamed Organisation'}
                </h2>
                <p className="text-sm text-slate-500 capitalize mt-0.5">
                  {selected.authority_type || 'General'}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <DetailRow label="Status" value={selected.verified ? 'Verified' : 'Unverified'} />
              <DetailRow label="Phone" value={selected.phone} />
              <DetailRow label="Address" value={selected.address} />
              <DetailRow label="Website" value={selected.website} />
              {selected.description && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Description</p>
                  <p className="text-slate-700">{selected.description}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full mt-6 py-2.5 border border-slate-200 rounded-lg text-sm
                         font-medium text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-slate-800">{value}</p>
    </div>
  )
}
