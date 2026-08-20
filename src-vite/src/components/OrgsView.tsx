import { useState } from 'react'
import type { AuthState } from '../types'
import { orgSignup, orgLogin, orgLogout, getMe, updateMe, deleteMe } from '../api'

interface Props {
  auth: AuthState
  onAuth: (state: AuthState) => void
}

export default function OrgsView({ auth, onAuth }: Props) {
  if (!auth.token) return <AuthForms onAuth={onAuth} />
  return <OrgDashboard auth={auth} onAuth={onAuth} />
}

function AuthForms({ onAuth }: { onAuth: (s: AuthState) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true); setError(null); setInfo(null)
    try {
      if (mode === 'signup') {
        const res: any = await orgSignup(email, password)
        setInfo(res.message ?? 'Check your email to confirm your account.')
        if (res.data?.access_token) {
          onAuth({ token: res.data.access_token, userId: res.data.user_id, email: res.data.email, profile: null })
        }
      } else {
        const res: any = await orgLogin(email, password)
        onAuth({ token: res.data.access_token, userId: res.data.user_id, email: res.data.email, profile: null })
      }
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-2xl mx-auto mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-white">{mode === 'login' ? 'Organisation Login' : 'Register Organisation'}</h2>
          <p className="text-slate-400 text-sm mt-1">{mode === 'login' ? 'Access your dashboard' : 'Create a new organisation account'}</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
        {info && <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">ℹ️ {info}</div>}

        <div className="space-y-3 mb-5">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
            className="input-base w-full" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
            className="input-base w-full" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        <button onClick={handleSubmit} disabled={loading || !email || !password}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mb-4">
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-slate-500">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(null); setInfo(null) }}
            className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

function OrgDashboard({ auth, onAuth }: { auth: AuthState; onAuth: (s: AuthState) => void }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadProfile() {
    setLoading(true)
    try {
      const res: any = await getMe(auth.token!)
      setProfile(res.data?.profile ?? null)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleUpdate() {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const res: any = await updateMe(auth.token!, editForm)
      setProfile(res.data)
      setEditing(false)
      setSuccess('Profile updated successfully.')
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleLogout() {
    await orgLogout(auth.token!).catch(() => {})
    onAuth({ token: null, userId: null, email: null, profile: null })
  }

  async function handleDelete() {
    if (!confirm('This will permanently delete your account. Are you sure?')) return
    await deleteMe(auth.token!).catch(() => {})
    onAuth({ token: null, userId: null, email: null, profile: null })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Organisation Dashboard</h2>
          <p className="text-sm text-slate-400 mt-0.5">{auth.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadProfile} disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#1e2130] border border-[#2a2d3e] text-slate-300 hover:bg-[#2a2d3e] transition-colors">
            {loading ? '…' : '↺ Load Profile'}
          </button>
          <button onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#1e2130] border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
      {success && <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">✅ {success}</div>}

      {/* Token display */}
      <div className="mb-4 p-4 rounded-xl bg-[#1e2130] border border-[#2a2d3e]">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Access Token</p>
        <p className="text-xs font-mono text-orange-400 break-all">{auth.token}</p>
      </div>

      {/* Profile */}
      {profile ? (
        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Profile</h3>
              <button onClick={() => { setEditing(e => !e); setEditForm({ name: profile.name ?? '', authority_type: profile.authority_type ?? '', description: profile.description ?? '', phone: profile.phone ?? '', address: profile.address ?? '', website: profile.website ?? '' }) }}
                className="text-xs px-3 py-1 rounded-lg bg-[#2a2d3e] hover:bg-[#3a3d4e] text-slate-300 transition-colors">
                {editing ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>
            {!editing ? (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries({ Name: profile.name, 'Authority Type': profile.authority_type, Phone: profile.phone, Address: profile.address, Website: profile.website, Verified: profile.verified ? '✅ Yes' : '❌ No' }).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{k}</p>
                    <p className="text-sm text-slate-200">{v ?? '—'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'name', label: 'Organisation Name', placeholder: 'e.g. Road Development Authority' },
                  { key: 'authority_type', label: 'Authority Type', placeholder: 'e.g. government' },
                  { key: 'description', label: 'Description', placeholder: 'What does your organisation do?' },
                  { key: 'phone', label: 'Phone', placeholder: '+94 11 234 5678' },
                  { key: 'address', label: 'Address', placeholder: 'Sethsiripaya, Battaramulla' },
                  { key: 'website', label: 'Website', placeholder: 'https://…' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                    <input value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} className="input-base w-full" />
                  </div>
                ))}
                <button onClick={handleUpdate} disabled={saving}
                  className="w-full py-2.5 mt-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <div className="text-3xl mb-2">🏢</div>
          <p className="text-sm">Click "Load Profile" to fetch your organisation profile</p>
        </div>
      )}

      {/* Danger zone */}
      <div className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Danger Zone</p>
        <p className="text-xs text-slate-400 mb-3">Permanently delete your organisation account. This action cannot be undone.</p>
        <button onClick={handleDelete}
          className="text-xs px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  )
}
