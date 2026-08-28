'use client'

import { createContext, useEffect, useState } from 'react'

export type AuthState = {
  token: string | null;
  userId: string | null;
  email: string | null;
};

const STORAGE_KEY = 'hazardwire_auth'

interface AuthContextValue {
  auth: AuthState
  setAuth: (state: AuthState) => void
}

const AUTH_DEFAULT: AuthState = {
  token: null,
  userId: null,
  email: null,
}

export const AuthContext = createContext<AuthContextValue>({
  auth: AUTH_DEFAULT,
  setAuth: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(AUTH_DEFAULT)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setAuthState(JSON.parse(saved))
    } catch {
      console.log('Failed to parse auth state from localStorage')
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
