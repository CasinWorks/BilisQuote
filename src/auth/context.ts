import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type AuthContextValue = {
  user: User | null
  email: string | null
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  register: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  loginWithGoogle: () => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
