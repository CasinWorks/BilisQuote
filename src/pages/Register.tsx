import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (p !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const res = await register(u, p)
      if (res.ok) {
        navigate('/', { replace: true })
      } else {
        setError(res.error || 'Registration failed.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Register</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-950">Create access</h1>
        <p className="mt-2 text-sm text-ink-600">
          Create a Supabase account (email/password). Depending on your Supabase Auth settings, you may need
          to confirm your email before you can sign in.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Email</span>
            <input
              type="email"
              autoComplete="email"
              className="rounded-lg border border-ink-200 px-3 py-2.5 text-sm"
              value={u}
              onChange={(e) => setU(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="rounded-lg border border-ink-200 px-3 py-2.5 text-sm"
              value={p}
              onChange={(e) => setP(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="rounded-lg border border-ink-200 px-3 py-2.5 text-sm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Register & continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-600">
          Already have access?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
