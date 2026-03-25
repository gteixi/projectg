'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { KitchenUser } from '@/types/database'
import { PinLogin } from './PinLogin'

interface AuthContextValue {
  activeUser: KitchenUser
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeUser, setActiveUser] = useState<KitchenUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('active_kitchen_user')
    if (stored) {
      try {
        setActiveUser(JSON.parse(stored) as KitchenUser)
      } catch {
        localStorage.removeItem('active_kitchen_user')
      }
    }
    setReady(true)
  }, [])

  function login(user: KitchenUser) {
    const { pin: _pin, ...session } = user
    localStorage.setItem('active_kitchen_user', JSON.stringify(session))
    setActiveUser(session as KitchenUser)
  }

  function logout() {
    localStorage.removeItem('active_kitchen_user')
    setActiveUser(null)
  }

  if (!ready) return null

  if (!activeUser) {
    return <PinLogin onLogin={login} />
  }

  return (
    <AuthContext.Provider value={{ activeUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
