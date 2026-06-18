'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { authStorage } from '@/lib/auth-storage'
import { gasClient } from '@/lib/gas-client'
import { User } from '@/types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; code: string; message: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    const token = authStorage.getToken()
    const cachedUser = authStorage.getUser()

    if (!token) {
      authStorage.clearSession()
      setUser(null)
      setLoading(false)
      return
    }

    if (!process.env.NEXT_PUBLIC_GAS_URL) {
      setUser(cachedUser)
      setLoading(false)
      return
    }

    const response = await gasClient.me(token)
    if (response.ok && response.data) {
      authStorage.setUser(response.data)
      setUser(response.data)
    } else {
      authStorage.clearSession()
      setUser(null)
    }
    setLoading(false)
  }

  async function login(email: string, password: string) {
    const response = await gasClient.login(email, password)

    if (response.ok && response.data) {
      const { session_token: sessionToken, ...nextUser } = response.data
      authStorage.setToken(sessionToken)
      authStorage.setUser(nextUser)
      setUser(nextUser)
    }

    return {
      ok: response.ok,
      code: response.code,
      message: response.message,
    }
  }

  async function logout() {
    const token = authStorage.getToken()
    if (token) {
      await gasClient.logout(token)
    }
    authStorage.clearSession()
    setUser(null)
  }

  useEffect(() => {
    void refreshUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
