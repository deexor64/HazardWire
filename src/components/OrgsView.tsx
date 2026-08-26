'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { orgSignup, orgLogin, orgLogout, getMe, updateMe } from '@/lib/api'
import type { AuthState } from '@/lib/types'

const BASE = '/api'

async function orgGetReports(token: string) {
  const res = await fetch(`${BASE}/orgs/reports`, { headers: { Authorization: `Bearer ${token}` } })
  const json = await res.json()
  if (!json.status) throw new Error(json.result || 'Failed to load reports')
  return json
}

async function orgUpdateReport(token: string, reportId: string, status: string, comment: string) {
  const params = new URLSearchParams({ status, comment })
  const res = await fetch(`${BASE}/orgs/reports/${reportId}?${params}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!json.status) throw new Error(json.result || 'Update failed')
  return json
}

export default function OrgsView() {
  const { auth, setAuth } = useAuth()
  if (!auth.token) return <AuthForms />
  return <OrgDashboard />
}

function AuthForms() {
  const { setAuth } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      if (mode === 'signup') {
        const res: any = await orgSignup(name, email, password)
        if (res.result?.access_token) {
          setAuth({ token: res.result.access_token, userId: res.result.id, email: res.result.email, profile: null })
        }
      } else {
        const res: any = await orgLogin(email, password)
        setAuth({ token: res.result.access_token, userId: res.result.id, email: res.result.email, profile: null })
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-slate-800">{mode === 'login' ? 'Organisation Login' : 'Register Organisation'}</h1>
        <p className="text-sm text-slate-500 mt-1">{mode === 'login' ? 'Sign in to manage hazard reports' : 'Create an account for your organisation'}</p>
      </div>
      {error && <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Organisation Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" placeholder="e.g. Road Development Authority" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" placeholder="name@organisation.lk" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" placeholder="••••••••" />
        </div>
        <button onClick={handleSubmit} disabled={loading} className="w-full py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50">
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </div>
      <p className="text-center text-sm text-slate-500 mt-5">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => { setMode((m) => (m === 'login' ? 'signup' : 'login')); setError('') }} className="text-orange-600 font-medium hover:underline">
          {mode === 'login' ? 'Register' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}

function OrgDashboard() {
  const { auth, setAuth } = useAuth()
  const [tab, setTab] = useState<'reports' | 'profile'>('reports')
  const [reports, setReports] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('in_progress')
  const [comment, setComment] = useState('')
  const [updating, setUpdating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [savingProfile, setSavingProfile] = useState(false)

  async function loadReports() {
    try {
      const res: any = await orgGetReports(auth.token!)
      setReports(res.result?.results || [])
    } catch (e: any) { setError(e.message) }
  }

  async function loadProfile() {
    try {
      const res: any = await getMe(auth.token!)
      setProfile(res.result)
    } catch (e: any) { console.error(e) }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadReports(), loadProfile()]).finally(() => setLoading(false))
  }, [])

  async function handleUpdateReport() {
    if (!selected) return
    setUpdating(true)
    try {
      await orgUpdateReport(auth.token!, selected.id, newStatus, comment)
      setSelected(null); setComment(''); loadReports()
    } catch (e: any) { alert(e.message) }
    finally { setUpdating(false) }
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const res: any = await updateMe(auth.token!, editForm)
      setProfile(res.result); setEditing(false)
    } catch (e: any) { alert(e.message) }
    finally { setSavingProfile(false) }
  }

  async function handleLogout() {
    await orgLogout(auth.token!).catch(() => {})
    setAuth({ token: null, userId: null, email: null, profile: null })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Organisation Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">{auth.email}</p>
        </div>
        <button onClick={handleLogout} className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Sign Out</button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {(['reports', 'profile'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {error && <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {tab === 'reports' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-700">Reports needing attention ({reports.length})</h2>
            <button onClick={loadReports} className="text-sm text-orange-600 hover:underline">Refresh</button>
          </div>
          {loading ? (
            <div className="text-center py-16 text-slate-500 text-sm">Loading…</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">No pending or assigned reports.</div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => {
                const thumb = (r.media_urls?.length ? r.media_urls : r.raw_media_urls || [])[0] || null
                return (
                  <button key={r.id} onClick={() => { setSelected(r); setNewStatus(['pending', 'assigned'].includes(r.status) ? 'in_progress' : r.status) }} className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300">
                    <div className="flex gap-3">
                      {thumb && <img src={thumb} alt="" className="w-14 h-14 rounded-lg object-cover border border-slate-100 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-medium text-slate-800">{r.title}</h3>
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-medium text-slate-800">Organisation Profile</h2>
            {!editing ? (
              <button onClick={() => { setEditForm({ name: profile?.name || '', authority_type: profile?.authority_type || '', description: profile?.description || '', phone: profile?.phone || '', address: profile?.address || '', website: profile?.website || '' }); setEditing(true) }} className="text-sm text-orange-600 hover:underline">Edit</button>
            ) : (
              <button onClick={() => setEditing(false)} className="text-sm text-slate-500 hover:underline">Cancel</button>
            )}
          </div>
          {!editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoItem label="Name" value={profile?.name} />
              <InfoItem label="Authority Type" value={profile?.authority_type} />
              <InfoItem label="Phone" value={profile?.phone} />
              <InfoItem label="Website" value={profile?.website} />
              <div className="sm:col-span-2"><InfoItem label="Address" value={profile?.address} /></div>
              <div className="sm:col-span-2"><InfoItem label="Description" value={profile?.description} /></div>
            </div>
          ) : (
            <div className="space-y-4">
              {[{ key: 'name', label: 'Organisation Name' }, { key: 'authority_type', label: 'Authority Type' }, { key: 'phone', label: 'Phone' }, { key: 'website', label: 'Website' }, { key: 'address', label: 'Address' }].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
                  <input value={editForm[field.key] || ''} onChange={(e) => setEditForm((f) => ({ ...f, [field.key]: e.target.value }))} className="input-base" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={editForm.description || ''} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="input-base resize-none" />
              </div>
              <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">{selected.title}</h2>
            <p className="text-sm text-slate-500 mb-5 line-clamp-3">{selected.description}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Update Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-base">
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {selected.ai_analysis && (
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">System analysis</label>
                  <p className="text-sm text-slate-600">{selected.ai_analysis.summary || '—'}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Comment (optional)</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="input-base resize-none" placeholder="What action was taken?" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setSelected(null); setComment('') }} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleUpdateReport} disabled={updating} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
                {updating ? 'Saving…' : 'Update Report'}
              </button>
            </div>
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
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize shrink-0 ${styles[status] || styles.pending}`}>{status?.replace('_', ' ') || 'Unknown'}</span>
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="font-medium text-slate-800">{value || '—'}</p>
    </div>
  )
}
