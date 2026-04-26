import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import { AuthContext } from './context'
import { useAppStore } from '../store/useAppStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase)
  const clearForSignOut = useAppStore((s) => s.clearForSignOut)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUser(data.user ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      clearForSignOut()
      return
    }
    void hydrateFromSupabase()
  }, [user, hydrateFromSupabase, clearForSignOut])

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) return { ok: false as const, error: error.message }
    return { ok: true as const }
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })
    if (error) return { ok: false as const, error: error.message }
    // If email confirmations are enabled, Supabase returns no session here.
    const needsEmailConfirmation = !data.session
    return { ok: true as const, needsEmailConfirmation }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) return { ok: false as const, error: error.message }
    return { ok: true as const }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const email = user?.email ?? null

  const value = useMemo(
    () => ({ user, email, login, register, loginWithGoogle, logout }),
    [user, email, login, register, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
