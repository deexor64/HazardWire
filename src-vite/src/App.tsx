import { useState } from 'react'
import type { View, AuthState } from './types'
import MapView from './components/MapView'
import ReportsView from './components/ReportsView'
import MyReportsView from './components/MyReportsView'
import SubmitView from './components/SubmitView'
import OrgsView from './components/OrgsView'

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'map', label: 'Map' },
  { id: 'reports', label: 'Reports' },
  { id: 'submit', label: 'Submit' },
  { id: 'my-reports', label: 'My Report' },
  { id: 'orgs', label: 'Organizations' },
]

export default function App() {
  const [view, setView] = useState<View>('map')
  const [auth, setAuth] = useState<AuthState>({ token: null, userId: null, email: null, profile: null })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold text-lg">HazardWire</span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === item.id
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="text-sm text-gray-500">
            {auth.token ? (
              <span className="text-green-600">{auth.email}</span>
            ) : (
              <span>Public</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === 'map' ? (
          <div className="h-[calc(100vh-3.5rem-3rem)] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <MapView />
          </div>
        ) : (
          <>
            {view === 'reports' && <ReportsView />}
            {view === 'submit' && <SubmitView />}
            {view === 'orgs' && <OrgsView auth={auth} onAuth={setAuth} />}
            {view === 'my-reports' && <MyReportsView />}
          </>
        )}
      </main>
    </div>
  )
}
