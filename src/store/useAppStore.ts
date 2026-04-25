import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

const DEFAULT_TERMS = `1. This quotation is valid for the period stated on the cover page unless withdrawn earlier in writing.
2. Acceptance of this quotation constitutes agreement to the scope of work, milestones, and pricing described herein.
3. Payment is due according to the payment schedule. Late payments may incur reasonable reminders; work may be paused until accounts are current where agreed in writing.
4. Changes to scope may require a revised quotation or written change order.
5. Either party may terminate for material breach subject to notice and cure where applicable, as further agreed in the engagement letter or contract.`

const DEFAULT_SCOPE = `Describe the deliverables, boundaries, and assumptions for this engagement.`

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
}

type Actions = {
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
  importFullState: (data: AppBackupPayload) => void
  resetData: () => void
}

const initialProfile: BusinessProfile = {
  contractorName: 'Your Name',
  businessName: '',
  email: '',
  phone: '',
  address: '',
  showTin: false,
  tin: '',
}

const initialSettings: AppSettings = {
  quotePrefix: 'Q',
  nextQuoteNumber: 1,
  invoicePrefix: 'INV',
  nextInvoiceNumber: 1,
  defaultValidityDays: 30,
  defaultInvoiceDueDays: 30,
  defaultTerms: DEFAULT_TERMS,
  defaultScope: DEFAULT_SCOPE,
}

const initialState: State = {
  profile: initialProfile,
  settings: initialSettings,
  clients: [],
  quotes: [],
  invoices: [],
  bankAccounts: [],
}

export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),

      setSettings: (st) =>
        set((s) => ({ settings: { ...s.settings, ...st } })),

      addClient: (c) => {
        const client: Client = {
          ...c,
          id: uid(),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ clients: [client, ...s.clients] }))
        return client
      },

      updateClient: (id, c) =>
        set((s) => ({
          clients: s.clients.map((x) => (x.id === id ? { ...x, ...c } : x)),
        })),

      deleteClient: (id) =>
        set((s) => ({
          clients: s.clients.filter((x) => x.id !== id),
        })),

      consumeNextQuoteNumber: () => {
        const { quotePrefix, nextQuoteNumber } = get().settings
        const num = nextQuoteNumber
        const str = `${quotePrefix}-${String(num).padStart(4, '0')}`
        set((s) => ({
          settings: { ...s.settings, nextQuoteNumber: num + 1 },
        }))
        return str
      },

      consumeNextInvoiceNumber: () => {
        const { invoicePrefix, nextInvoiceNumber } = get().settings
        const num = nextInvoiceNumber
        const str = `${invoicePrefix}-${String(num).padStart(4, '0')}`
        set((s) => ({
          settings: { ...s.settings, nextInvoiceNumber: num + 1 },
        }))
        return str
      },

      addQuote: (q) => {
        const number = get().consumeNextQuoteNumber()
        const now = new Date().toISOString()
        const quote: Quote = {
          ...q,
          id: uid(),
          number,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ quotes: [quote, ...s.quotes] }))
        return quote
      },

      updateQuote: (id, patch) =>
        set((s) => ({
          quotes: s.quotes.map((x) =>
            x.id === id
              ? { ...x, ...patch, updatedAt: new Date().toISOString() }
              : x,
          ),
        })),

      deleteQuote: (id) =>
        set((s) => ({ quotes: s.quotes.filter((x) => x.id !== id) })),

      addInvoice: (inv) => {
        const number = get().consumeNextInvoiceNumber()
        const now = new Date().toISOString()
        const invoice: Invoice = {
          ...inv,
          id: uid(),
          number,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ invoices: [invoice, ...s.invoices] }))
        return invoice
      },

      updateInvoice: (id, patch) =>
        set((s) => ({
          invoices: s.invoices.map((x) =>
            x.id === id
              ? { ...x, ...patch, updatedAt: new Date().toISOString() }
              : x,
          ),
        })),

      deleteInvoice: (id) =>
        set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) })),

      addBankAccount: (b) => {
        const row: BankAccount = { ...b, id: uid() }
        set((s) => ({ bankAccounts: [row, ...s.bankAccounts] }))
        return row
      },

      updateBankAccount: (id, patch) =>
        set((s) => ({
          bankAccounts: s.bankAccounts.map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        })),

      deleteBankAccount: (id) =>
        set((s) => ({
          bankAccounts: s.bankAccounts.filter((x) => x.id !== id),
        })),

      importFullState: (data) =>
        set({
          profile: data.profile,
          settings: data.settings,
          clients: data.clients,
          quotes: data.quotes,
          invoices: data.invoices,
          bankAccounts: data.bankAccounts ?? [],
        }),

      resetData: () => set({ ...initialState }),
    }),
    {
      name: 'quotation-invoice-app-v1',
      version: 3,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState
        const s = persistedState as State
        if (version < 2) {
          s.quotes = (s.quotes ?? []).map((q) =>
            migrateQuoteFromLegacy(q as Record<string, unknown>),
          )
          s.invoices = (s.invoices ?? []).map((inv) =>
            migrateInvoiceFromLegacy(inv as Record<string, unknown>),
          )
        }
        if (version < 3) {
          if (!Array.isArray(s.bankAccounts)) s.bankAccounts = []
        }
        return s
      },
    },
  ),
)
