import { useState, useEffect } from 'react'
import type { View, AuthState } from './types'
import MapView from './components/MapView'
import ReportsView from './components/ReportsView'
import MyReportsView from './components/MyReportsView'
import SubmitView from './components/SubmitView'
import OrgsView from './components/OrgsView'
import AuthoritiesView from './components/AuthoritiesView'

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'map', label: 'Map' },
  { id: 'reports', label: 'Reports' },
  { id: 'submit', label: 'Submit Report' },
  { id: 'my-reports', label: 'My Report' },
  { id: 'authorities', label: 'Authorities' },
  { id: 'orgs', label: 'Org Login' },
]

const defaultAuth: AuthState = {
  token: null,
  userId: null,
  email: null,
  profile: null,
}

export default function App() {
  const [view, setView] = useState<View>('map')
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('hazardwire_auth')
    return saved ? JSON.parse(saved) : defaultAuth
  })

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem('hazardwire_auth', JSON.stringify(auth))
    } else {
      localStorage.removeItem('hazardwire_auth')
    }
  }, [auth])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
              H
            </div>
            <span className="font-semibold text-slate-800">HazardWire</span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  view === item.id
                    ? item.id === 'submit'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="text-sm text-slate-500 shrink-0 hidden sm:block">
            {auth.token ? (
              <span className="text-emerald-600 font-medium">{auth.email}</span>
            ) : (
              <span>Public</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {view === 'map' && (
          <div className="h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-slate-200 bg-white">
            <MapView />
          </div>
        )}
        {view === 'reports' && <ReportsView />}
        {view === 'submit' && <SubmitView />}
        {view === 'my-reports' && <MyReportsView />}
        {view === 'authorities' && <AuthoritiesView />}
        {view === 'orgs' && <OrgsView auth={auth} onAuth={setAuth} />}
      </main>
    </div>
  )
}
