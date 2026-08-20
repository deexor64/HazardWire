import { useState } from 'react'
import type { View, AuthState } from './types'
import MapView from './components/MapView'
import ReportsView from './components/ReportsView'
import SubmitView from './components/SubmitView'
import OrgsView from './components/OrgsView'

const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'reports', label: 'Reports', icon: '📋' },
  { id: 'submit', label: 'Submit Report', icon: '🚨' },
  { id: 'orgs', label: 'Organizations', icon: '🏢' },
]

export default function App() {
  const [view, setView] = useState<View>('map')
  const [auth, setAuth] = useState<AuthState>({ token: null, userId: null, email: null, profile: null })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-[#0b0d14] overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-[#13151f] border-r border-[#2a2d3e] transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'} flex-shrink-0`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#2a2d3e] ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#f97316" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="font-bold text-white text-base leading-none">
                Hazard<span className="text-orange-400">Wire</span>
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">Civic Hazard Platform</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`nav-item w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${view === item.id
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:bg-[#1e2130] hover:text-slate-200 border border-transparent'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {!sidebarCollapsed && item.id === 'submit' && (
                <span className="ml-auto text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
              )}
            </button>
          ))}
        </nav>

        {/* Auth status + collapse */}
        <div className="px-2 py-3 border-t border-[#2a2d3e] space-y-2">
          {!sidebarCollapsed && auth.token && (
            <div className="px-2 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-[10px] text-green-400 font-semibold">● Signed in</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{auth.email}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            className="nav-item w-full flex items-center justify-center py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-[#1e2130] text-xs"
          >
            {sidebarCollapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-3.5 border-b border-[#2a2d3e] bg-[#13151f]/80 backdrop-blur-sm flex-shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-white capitalize">
              {NAV_ITEMS.find(n => n.id === view)?.icon} {NAV_ITEMS.find(n => n.id === view)?.label}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-[#1e2130] border border-[#2a2d3e] text-slate-400 hover:text-orange-400 hover:border-orange-500/30 transition-colors flex items-center gap-1.5"
            >
              <span>⚡</span> API Docs
            </a>
            {auth.token && (
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Connected" />
            )}
          </div>
        </div>

        {/* View content */}
        <div className="flex-1 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
          {view === 'map' && <MapView />}
          {view === 'reports' && <ReportsView />}
          {view === 'submit' && <SubmitView />}
          {view === 'orgs' && <OrgsView auth={auth} onAuth={setAuth} />}
        </div>
      </main>
    </div>
  )
}
