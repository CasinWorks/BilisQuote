import type {
  AppSettings,
  BankAccount,
  BusinessProfile,
  Client,
  Invoice,
  Quote,
} from '../types'

/** Backup file format — use JSON (not CSV) so nested quotes/invoices survive. */
export const BACKUP_SCHEMA_VERSION = 1

export type AppBackupPayload = {
  schemaVersion: number
  exportedAt: string
  app: string
  profile: BusinessProfile
  settings: AppSettings
  clients: Client[]
  quotes: Quote[]
  invoices: Invoice[]
  bankAccounts: BankAccount[]
}

export function buildBackupPayload(state: {
  profile: BusinessProfile
  settings: AppSettings
  clients: Client[]
  quotes: Quote[]
  invoices: Invoice[]
  bankAccounts: BankAccount[]
}): AppBackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'quotation-generator',
    profile: state.profile,
    settings: state.settings,
    clients: state.clients,
    quotes: state.quotes,
    invoices: state.invoices,
    bankAccounts: state.bankAccounts,
  }
}

export function parseBackupPayload(raw: unknown): { ok: true; data: AppBackupPayload } | { ok: false; error: string } {
  if (raw === null || typeof raw !== 'object') {
    return { ok: false, error: 'File is not valid JSON.' }
  }
  const o = raw as Record<string, unknown>

  if (o.app != null && o.app !== 'quotation-generator') {
    return { ok: false, error: 'This file is not a backup from this app.' }
  }

  if (typeof o.profile !== 'object' || o.profile === null) {
    return { ok: false, error: 'Backup is missing profile.' }
  }
  if (typeof o.settings !== 'object' || o.settings === null) {
    return { ok: false, error: 'Backup is missing settings.' }
  }
  if (!Array.isArray(o.clients)) return { ok: false, error: 'Backup is missing clients array.' }
  if (!Array.isArray(o.quotes)) return { ok: false, error: 'Backup is missing quotes array.' }
  if (!Array.isArray(o.invoices)) return { ok: false, error: 'Backup is missing invoices array.' }

  const bankAccounts = Array.isArray(o.bankAccounts) ? (o.bankAccounts as BankAccount[]) : []

  const data: AppBackupPayload = {
    schemaVersion: typeof o.schemaVersion === 'number' ? o.schemaVersion : 1,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : '',
    app: 'quotation-generator',
    profile: o.profile as BusinessProfile,
    settings: o.settings as AppSettings,
    clients: o.clients as Client[],
    quotes: o.quotes as Quote[],
    invoices: o.invoices as Invoice[],
    bankAccounts,
  }

  return { ok: true, data }
}

export function downloadBackupJson(payload: AppBackupPayload): void {
  const name = `quotation-app-backup-${new Date().toISOString().slice(0, 10)}.json`
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
