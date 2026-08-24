import { useState, useEffect } from 'react'
import type { AuthState } from '../types'
import { orgSignup, orgLogin, orgLogout, getMe } from '../api'

interface Props {
  auth: AuthState
  onAuth: (state: AuthState) => void
}

const BASE = '/api'

async function orgGetReports(token: string) {
  const res = await fetch(`${BASE}/orgs/reports`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const json = await res.json()
  if (!json.status) throw new Error(json.result || 'Failed')
  return json
}

async function orgUpdateReport(token: string, reportId: string, status: string, comment: string) {
  const res = await fetch(`${BASE}/orgs/reports/${reportId}?status=${status}&comment=${encodeURIComponent(comment)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  })
  const json = await res.json()
  if (!json.status) throw new Error(json.result || 'Failed')
  return json
}

export default function OrgsView({ auth, onAuth }: Props) {
  if (!auth.token) return <AuthForms onAuth={onAuth} />
  return <OrgDashboard auth={auth} onAuth={onAuth} />
}

function AuthForms({ onAuth }: { onAuth: (s: AuthState) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      if (mode === 'signup') {
        const res: any = await orgSignup(name, email, password)
        if (res.result?.access_token) {
          onAuth({
            token: res.result.access_token,
            userId: res.result.id,
            email: res.result.email,
            profile: null
          })
        }
      } else {
        const res: any = await orgLogin(email, password)
        onAuth({
          token: res.result.access_token,
          userId: res.result.id,
          email: res.result.email,
          profile: null
        })
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-2 text-center">
        {mode === 'login' ? 'Organisation Login' : 'Register Organisation'}
      </h1>
      <p className="text-gray-500 text-center mb-8 text-sm">
        {mode === 'login' ? 'Access your dashboard' : 'Create a new organisation account'}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {mode === 'signup' && (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Organisation Name"
            className="input-base"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="input-base"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="input-base"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
          className="text-orange-500 font-medium"
        >
          {mode === 'login' ? 'Register' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}

function OrgDashboard({ auth, onAuth }: { auth: AuthState; onAuth: (s: AuthState) => void }) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('in_progress')
  const [comment, setComment] = useState('')
  const [updating, setUpdating] = useState(false)

  async function loadReports() {
    setLoading(true)
    setError('')
    try {
      const res: any = await orgGetReports(auth.token!)
      setReports(res.result?.results || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  async function handleUpdate() {
    if (!selected) return
    setUpdating(true)
    try {
      await orgUpdateReport(auth.token!, selected.id, newStatus, comment)
      setSelected(null)
      setComment('')
      loadReports()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleLogout() {
    await orgLogout(auth.token!).catch(() => {})
    onAuth({ token: null, userId: null, email: null, profile: null })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Organisation Dashboard</h1>
          <p className="text-sm text-gray-500">{auth.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Sign Out
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Assigned / Pending Reports ({reports.length})</h2>
        <button
          onClick={loadReports}
          className="text-sm text-orange-500 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500">No reports available.</p>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div
              key={r.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:border-orange-300 cursor-pointer"
              onClick={() => {
                setSelected(r)
                setNewStatus(r.status === 'pending' ? 'in_progress' : r.status)
              }}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{r.title}</h3>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.description}</p>
              <div className="text-xs text-gray-400 mt-2 capitalize">
                {r.category || '—'} · {r.severity || '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
            <p className="text-sm text-gray-600 mb-4">{selected.description}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="input-base"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  className="input-base"
                  placeholder="Add a note about the action taken..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Update Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
