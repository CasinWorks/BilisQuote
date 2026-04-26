import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useAppStore } from '../store/useAppStore'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-white text-ink-900 shadow-sm border border-ink-200'
      : 'text-ink-600 hover:text-ink-900 hover:bg-white/60',
  ].join(' ')

export function Layout() {
  const { email, logout } = useAuth()
  const navigate = useNavigate()
  const hydrating = useAppStore((s) => s.hydrating)
  const syncError = useAppStore((s) => s.syncError)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Contractor workspace
            </p>
            <h1 className="font-display text-lg font-semibold text-ink-950">
              Quotations & invoices
            </h1>
            {email ? (
              <p className="text-xs text-ink-500 mt-1">Signed in as {email}</p>
            ) : null}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" className={linkClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/clients" className={linkClass}>
              Clients
            </NavLink>
            <NavLink to="/quotes" className={linkClass}>
              Quotes
            </NavLink>
            <NavLink to="/invoices" className={linkClass}>
              Invoices
            </NavLink>
            <NavLink to="/settings" className={linkClass}>
              Settings
            </NavLink>
            <NavLink to="/bank-details" className={linkClass}>
              Bank details
            </NavLink>
          </nav>
          <button
            type="button"
            onClick={() => {
              void logout().finally(() => navigate('/login', { replace: true }))
            }}
            className="text-sm font-medium text-ink-600 hover:text-ink-900 px-3 py-2 rounded-md hover:bg-ink-100 self-start sm:self-center"
          >
            Log out
          </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {syncError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {syncError}
          </div>
        ) : null}
        {hydrating ? (
          <div className="mb-4 rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700">
            Loading your data from Supabase…
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  )
}
