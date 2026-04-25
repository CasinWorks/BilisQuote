import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function Register() {
  const { username, register } = useAuth()
  const navigate = useNavigate()

  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (username) {
    return <Navigate to="/" replace />
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (p !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (register(u, p)) {
      navigate('/', { replace: true })
    } else {
      setError(
        'Registration only accepts the configured credentials. Use the same username and password as in Vercel env (or the default admin / admin).',
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Register</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-950">Create access</h1>
        <p className="mt-2 text-sm text-ink-600">
          This is a client-side gate. Only the username/password pair configured for this deployment
          will work (defaults: <span className="font-mono">admin</span> /{' '}
          <span className="font-mono">admin</span>).
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Username</span>
            <input
              autoComplete="username"
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
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Register & continue
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
