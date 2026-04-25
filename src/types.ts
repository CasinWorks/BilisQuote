export type Client = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  billingAddress: string
  notes: string
  createdAt: string
}

export type ScopeLineItem = {
  id: string
  description: string
  details: string
  /** Optional line amount; leave empty to show blank in the Amount column */
  amount: number | null
}

export type Milestone = {
  id: string
  label: string
  percent: number
  /** When set, this row uses this exact peso amount (e.g. agreed downpayment); % is derived from contract total */
  fixedAmount?: number | null
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'

export type Quote = {
  id: string
  number: string
  clientId: string
  issueDate: string
  validUntil: string
  validityDays: number
  scopeLines: ScopeLineItem[]
  milestones: Milestone[]
  contractTotal: number
  withholdingEnabled: boolean
  withholdingPercent: number
  termsAndConditions: string
  status: QuoteStatus
  createdAt: string
  updatedAt: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export type Invoice = {
  id: string
  number: string
  clientId: string
  quoteId: string | null
  /** Denormalized for display when exporting */
  linkedQuoteNo?: string | null
  issueDate: string
  dueDate: string
  scopeLines: ScopeLineItem[]
  milestones: Milestone[]
  contractTotal: number
  withholdingEnabled: boolean
  withholdingPercent: number
  termsAndConditions: string
  status: InvoiceStatus
  createdAt: string
  updatedAt: string
}

export type BankAccount = {
  id: string
  /** Matches `PRESET_PH_BANKS` id, or `OTHER` for custom name */
  bankPresetId: string
  /** Required when `bankPresetId` is `OTHER` */
  customBankName: string
  accountName: string
  accountNumber: string
  /** Optional branch / notes (e.g. “Savings”, “CA”) */
  notes: string
}

export type BusinessProfile = {
  contractorName: string
  businessName: string
  email: string
  phone: string
  address: string
  showTin: boolean
  tin: string
}

export type AppSettings = {
  quotePrefix: string
  nextQuoteNumber: number
  invoicePrefix: string
  nextInvoiceNumber: number
  defaultValidityDays: number
  defaultInvoiceDueDays: number
  defaultTerms: string
  defaultScope: string
}
