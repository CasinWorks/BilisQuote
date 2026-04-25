import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function Login() {
  const { username, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const rawFrom = (location.state as { from?: string } | null)?.from
  const from =
    typeof rawFrom === 'string' && rawFrom.startsWith('/') && !rawFrom.startsWith('//')
      ? rawFrom
      : '/'

  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (username) {
    return <Navigate to={from} replace />
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (login(u, p)) {
      navigate(from, { replace: true })
    } else {
      setError('Invalid username or password.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Sign in</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-950">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-600">
          This build uses a single demo account. Set{' '}
          <code className="text-xs bg-ink-100 px-1 py-0.5 rounded">VITE_AUTH_USERNAME</code> /{' '}
          <code className="text-xs bg-ink-100 px-1 py-0.5 rounded">VITE_AUTH_PASSWORD</code> on
          Vercel to change it.
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
              autoComplete="current-password"
              className="rounded-lg border border-ink-200 px-3 py-2.5 text-sm"
              value={p}
              onChange={(e) => setP(e.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-600">
          No account?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Register
          </Link>
        </p>
      </div>
      <p className="mt-8 max-w-md text-center text-xs text-ink-400">
        Default credentials: <span className="font-mono">admin</span> /{' '}
        <span className="font-mono">admin</span> — change via environment variables for public deploys.
      </p>
    </div>
  )
}
