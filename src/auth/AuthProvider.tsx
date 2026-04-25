import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AUTH_PASSWORD, AUTH_STORAGE_KEY, AUTH_USERNAME } from './config'
import { AuthContext } from './context'

function readStoredUsername(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { username?: string }
    return typeof parsed.username === 'string' ? parsed.username : null
  } catch {
    return null
  }
}

function credentialsMatch(username: string, password: string): boolean {
  return username.trim() === AUTH_USERNAME && password === AUTH_PASSWORD
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(() => readStoredUsername())

  const persist = useCallback((u: string | null) => {
    if (u) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ username: u }))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [])

  const login = useCallback(
    (u: string, password: string) => {
      if (!credentialsMatch(u, password)) return false
      const name = u.trim()
      setUsername(name)
      persist(name)
      return true
    },
    [persist],
  )

  const register = useCallback(
    (u: string, password: string) => {
      if (!credentialsMatch(u, password)) return false
      const name = u.trim()
      setUsername(name)
      persist(name)
      return true
    },
    [persist],
  )

  const logout = useCallback(() => {
    setUsername(null)
    persist(null)
  }, [persist])

  const value = useMemo(
    () => ({ username, login, register, logout }),
    [username, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
