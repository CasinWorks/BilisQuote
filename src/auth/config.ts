/**
 * Demo auth — credentials are bundled with the client. Anyone can extract them from
 * network or source; use real server-side auth for sensitive data.
 * Override via Vite env on Vercel: VITE_AUTH_USERNAME, VITE_AUTH_PASSWORD
 */
export const AUTH_USERNAME =
  (import.meta.env.VITE_AUTH_USERNAME as string | undefined)?.trim() || 'admin'

export const AUTH_PASSWORD =
  (import.meta.env.VITE_AUTH_PASSWORD as string | undefined)?.trim() || 'admin'

export const AUTH_STORAGE_KEY = 'quotation-auth-session-v1'
