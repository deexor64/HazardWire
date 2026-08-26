'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

const NAV_ITEMS = [
  { href: '/', label: 'Map' },
  { href: '/reports', label: 'Reports' },
  { href: '/submit', label: 'Submit' },
  { href: '/my-reports', label: 'My Reports' },
  { href: '/authorities', label: 'Authorities' },
  { href: '/orgs', label: 'Organization' },
]

export default function Header() {
  const pathname = usePathname()
  const { auth } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo and title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
            H
          </div>
          <span className="font-semibold text-slate-800">HazardWire</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? href === '/submit'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Auth state */}
        <div className="text-sm text-slate-500 shrink-0 hidden sm:block">
          {auth.token ? (
            <span className="text-emerald-600 font-medium">{auth.email}</span>
          ) : (
            <span>Public</span>
          )}
        </div>
      </div>
    </header>
  )
}
