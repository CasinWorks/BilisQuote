import { create } from 'zustand'
import type { AppBackupPayload } from '../lib/backup'
import type {
  AppSettings,
  BankAccount,
  BusinessProfile,
  Client,
  Invoice,
  Quote,
  ScopeLineItem,
} from '../types'
import {
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  deleteBankAccountRow,
  deleteClientRow,
  deleteInvoiceRow,
  deleteQuoteRow,
  fetchAppData,
  replaceAllAppData,
  rpcConsumeNextInvoiceNumber,
  rpcConsumeNextQuoteNumber,
  upsertBankAccountRow,
  upsertClient,
  upsertInvoice,
  upsertProfile,
  upsertQuote,
  upsertSettings,
} from '../supabase/data'

function uid(): string {
  return crypto.randomUUID()
}

function migrateQuoteFromLegacy(q: Record<string, unknown>): Quote {
  const lines = q.scopeLines as ScopeLineItem[] | undefined
  const sow = q.scopeOfWork as string | undefined
  if (lines && Array.isArray(lines) && lines.length > 0) {
    return q as Quote
  }
  return {
    ...(q as object),
    scopeLines: sow?.trim()
      ? [{ id: uid(), description: '', details: sow, amount: null }]
      : [{ id: uid(), description: '', details: '', amount: null }],
  } as Quote
}

function migrateInvoiceFromLegacy(inv: Record<string, unknown>): Invoice {
  const lines = inv.scopeLines as ScopeLineItem[] | undefined
  const sow = inv.scopeOfWork as string | undefined
  if (lines && Array.isArray(lines) && lines.length > 0) {
    return inv as Invoice
  }
  return {
    ...(inv as object),
    scopeLines: sow?.trim()
      ? [{ id: uid(), description: '', details: sow, amount: null }]
      : [{ id: uid(), description: '', details: '', amount: null }],
  } as Invoice
}

type State = {
  profile: BusinessProfile
  settings: AppSettings
  clients: Client[]
  quotes: Quote[]
  invoices: Invoice[]
  bankAccounts: BankAccount[]
  hydrating: boolean
  hydrated: boolean
  syncError: string | null
}

type Actions = {
  hydrateFromSupabase: () => Promise<void>
  clearForSignOut: () => void
  setProfile: (p: Partial<BusinessProfile>) => void
  setSettings: (s: Partial<AppSettings>) => void
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => Client
  updateClient: (id: string, c: Partial<Client>) => void
  deleteClient: (id: string) => void
  addQuote: (q: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'number'>) => Quote
  updateQuote: (id: string, q: Partial<Quote>) => void
  deleteQuote: (id: string) => void
  addInvoice: (inv: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'number'>) => Invoice
  updateInvoice: (id: string, inv: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  consumeNextQuoteNumber: () => string
  consumeNextInvoiceNumber: () => string
  addBankAccount: (b: Omit<BankAccount, 'id'>) => BankAccount
  updateBankAccount: (id: string, b: Partial<BankAccount>) => void
  deleteBankAccount: (id: string) => void
  /** Replace all persisted app data (used after importing a backup file). */
  importFullState: (data: AppBackupPayload) => Promise<void>
  resetData: () => void
}

const initialState: State = {
  profile: DEFAULT_PROFILE,
  settings: DEFAULT_SETTINGS,
  clients: [],
  quotes: [],
  invoices: [],
  bankAccounts: [],
  hydrating: false,
  hydrated: false,
  syncError: null,
}

export const useAppStore = create<State & Actions>()((set, get) => ({
  ...initialState,

  hydrateFromSupabase: async () => {
    set({ hydrating: true, syncError: null })
    try {
      const data = await fetchAppData()
      set({
        profile: data.profile,
        settings: data.settings,
        clients: data.clients,
        quotes: data.quotes,
        invoices: data.invoices,
        bankAccounts: data.bankAccounts,
        hydrated: true,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load data from Supabase.'
      set({ syncError: msg })
      throw e
    } finally {
      set({ hydrating: false })
    }
  },

  clearForSignOut: () => set({ ...initialState }),

  setProfile: (p) => {
    set((s) => ({ profile: { ...s.profile, ...p } }))
    void upsertProfile(get().profile).catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to save profile.' }),
    )
  },

  setSettings: (st) => {
    set((s) => ({ settings: { ...s.settings, ...st } }))
    void upsertSettings(get().settings).catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to save settings.' }),
    )
  },

  addClient: (c) => {
    const client: Client = {
      ...c,
      id: uid(),
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ clients: [client, ...s.clients] }))
    void upsertClient(client).catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to save client.' }),
    )
    return client
  },

  updateClient: (id, c) => {
    set((s) => ({
      clients: s.clients.map((x) => (x.id === id ? { ...x, ...c } : x)),
    }))
    const row = get().clients.find((x) => x.id === id)
    if (row) {
      void upsertClient(row).catch((e) =>
        set({ syncError: e instanceof Error ? e.message : 'Failed to save client.' }),
      )
    }
  },

  deleteClient: (id) => {
    set((s) => ({
      clients: s.clients.filter((x) => x.id !== id),
      quotes: s.quotes.filter((q) => q.clientId !== id),
      invoices: s.invoices.filter((inv) => inv.clientId !== id),
    }))
    void deleteClientRow(id).catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to delete client.' }),
    )
  },

  consumeNextQuoteNumber: () => {
    const { quotePrefix, nextQuoteNumber } = get().settings
    const num = nextQuoteNumber
    const str = `${quotePrefix}-${String(num).padStart(4, '0')}`
    set((s) => ({
      settings: { ...s.settings, nextQuoteNumber: num + 1 },
    }))
    void upsertSettings(get().settings).catch(() => {})
    return str
  },

  consumeNextInvoiceNumber: () => {
    const { invoicePrefix, nextInvoiceNumber } = get().settings
    const num = nextInvoiceNumber
    const str = `${invoicePrefix}-${String(num).padStart(4, '0')}`
    set((s) => ({
      settings: { ...s.settings, nextInvoiceNumber: num + 1 },
    }))
    void upsertSettings(get().settings).catch(() => {})
    return str
  },

  addQuote: (q) => {
    const now = new Date().toISOString()
    const quote: Quote = {
      ...q,
      id: uid(),
      number: 'PENDING',
      createdAt: now,
      updatedAt: now,
    }

    set((s) => ({ quotes: [quote, ...s.quotes] }))

    void (async () => {
      const n = (await rpcConsumeNextQuoteNumber()) ?? get().consumeNextQuoteNumber()
      const patched: Quote = { ...quote, number: n }
      set((s) => ({
        quotes: s.quotes.map((x) => (x.id === quote.id ? patched : x)),
      }))
      await upsertQuote(patched)
    })().catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to save quotation.' }),
    )

    return quote
  },

  updateQuote: (id, patch) => {
    set((s) => ({
      quotes: s.quotes.map((x) =>
        x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x,
      ),
    }))
    const row = get().quotes.find((x) => x.id === id)
    if (row) {
      void upsertQuote(row).catch((e) =>
        set({ syncError: e instanceof Error ? e.message : 'Failed to save quotation.' }),
      )
    }
  },

  deleteQuote: (id) => {
    set((s) => ({ quotes: s.quotes.filter((x) => x.id !== id) }))
    void deleteQuoteRow(id).catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to delete quotation.' }),
    )
  },

  addInvoice: (inv) => {
    const now = new Date().toISOString()
    const row: Invoice = {
      ...inv,
      id: uid(),
      number: 'PENDING',
      createdAt: now,
      updatedAt: now,
    }

    set((s) => ({ invoices: [row, ...s.invoices] }))

    void (async () => {
      const n = (await rpcConsumeNextInvoiceNumber()) ?? get().consumeNextInvoiceNumber()
      const patched: Invoice = { ...row, number: n }
      set((s) => ({
        invoices: s.invoices.map((x) => (x.id === row.id ? patched : x)),
      }))
      await upsertInvoice(patched)
    })().catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to save invoice.' }),
    )

    return row
  },

  updateInvoice: (id, patch) => {
    set((s) => ({
      invoices: s.invoices.map((x) =>
        x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x,
      ),
    }))
    const row = get().invoices.find((x) => x.id === id)
    if (row) {
      void upsertInvoice(row).catch((e) =>
        set({ syncError: e instanceof Error ? e.message : 'Failed to save invoice.' }),
      )
    }
  },

  deleteInvoice: (id) => {
    set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) }))
    void deleteInvoiceRow(id).catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to delete invoice.' }),
    )
  },

  addBankAccount: (b) => {
    const row: BankAccount = { ...b, id: uid() }
    set((s) => ({ bankAccounts: [row, ...s.bankAccounts] }))
    void upsertBankAccountRow(row).catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to save bank account.' }),
    )
    return row
  },

  updateBankAccount: (id, patch) => {
    set((s) => ({
      bankAccounts: s.bankAccounts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }))
    const row = get().bankAccounts.find((x) => x.id === id)
    if (row) {
      void upsertBankAccountRow(row).catch((e) =>
        set({ syncError: e instanceof Error ? e.message : 'Failed to save bank account.' }),
      )
    }
  },

  deleteBankAccount: (id) => {
    set((s) => ({
      bankAccounts: s.bankAccounts.filter((x) => x.id !== id),
    }))
    void deleteBankAccountRow(id).catch((e) =>
      set({ syncError: e instanceof Error ? e.message : 'Failed to delete bank account.' }),
    )
  },

  importFullState: async (data) => {
    // Keep legacy migrations for older backup payloads.
    const quotes = (data.quotes ?? []).map((q) =>
      migrateQuoteFromLegacy(q as unknown as Record<string, unknown>),
    )
    const invoices = (data.invoices ?? []).map((inv) =>
      migrateInvoiceFromLegacy(inv as unknown as Record<string, unknown>),
    )
    const bankAccounts = data.bankAccounts ?? []
    set({
      profile: data.profile,
      settings: data.settings,
      clients: data.clients,
      quotes,
      invoices,
      bankAccounts,
    })

    try {
      await replaceAllAppData({
        profile: data.profile,
        settings: data.settings,
        clients: data.clients,
        quotes,
        invoices,
        bankAccounts,
      })
    } catch (e) {
      set({ syncError: e instanceof Error ? e.message : 'Failed to import data to Supabase.' })
      throw e
    }
  },

  resetData: () => set({ ...initialState }),
}))
