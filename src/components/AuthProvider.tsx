'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { AuthState } from '@/lib/types'

const STORAGE_KEY = 'hazardwire_auth'

const DEFAULT_AUTH: AuthState = {
  token: null,
  userId: null,
  email: null,
}

interface AuthContextValue {
  auth: AuthState
  setAuth: (state: AuthState) => void
}

const AuthContext = createContext<AuthContextValue>({
  auth: DEFAULT_AUTH,
  setAuth: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(DEFAULT_AUTH)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setAuthState(JSON.parse(saved))
    } catch {
      // ignore malformed JSON
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever auth changes (after hydration)
  useEffect(() => {
    if (!hydrated) return
    if (auth.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [auth, hydrated])

  function setAuth(state: AuthState) {
    setAuthState(state)
  }

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
