import type {
  AppSettings,
  BankAccount,
  BusinessProfile,
  Client,
  Invoice,
  Quote,
} from '../types'
import { supabase } from './client'

export type AppData = {
  profile: BusinessProfile
  settings: AppSettings
  clients: Client[]
  quotes: Quote[]
  invoices: Invoice[]
  bankAccounts: BankAccount[]
}

export async function replaceAllAppData(payload: AppData): Promise<void> {
  const userId = await requireUserId()

  // Upsert single-row tables first.
  await upsertProfile(payload.profile)
  await upsertSettings(payload.settings)

  // Delete in FK-safe order.
  const [{ error: invDelErr }, { error: quoteDelErr }, { error: bankDelErr }, { error: clientDelErr }] =
    await Promise.all([
      supabase.from('invoices').delete().eq('user_id', userId),
      supabase.from('quotes').delete().eq('user_id', userId),
      supabase.from('bank_accounts').delete().eq('user_id', userId),
      supabase.from('clients').delete().eq('user_id', userId),
    ])
  if (invDelErr) throw invDelErr
  if (quoteDelErr) throw quoteDelErr
  if (bankDelErr) throw bankDelErr
  if (clientDelErr) throw clientDelErr

  // Insert in FK-safe order.
  if (payload.clients.length) {
    const { error } = await supabase.from('clients').insert(
      payload.clients.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        billing_address: c.billingAddress,
        notes: c.notes,
        created_at: c.createdAt,
      })),
    )
    if (error) throw error
  }

  if (payload.quotes.length) {
    const { error } = await supabase.from('quotes').insert(
      payload.quotes.map((q) => ({
        id: q.id,
        user_id: userId,
        number: q.number,
        client_id: q.clientId,
        issue_date: q.issueDate,
        valid_until: q.validUntil,
        validity_days: q.validityDays,
        scope_lines: q.scopeLines,
        milestones: q.milestones,
        contract_total: q.contractTotal,
        withholding_enabled: q.withholdingEnabled,
        withholding_percent: q.withholdingPercent,
        terms_and_conditions: q.termsAndConditions,
        status: q.status,
        created_at: q.createdAt,
        updated_at: q.updatedAt,
      })),
    )
    if (error) throw error
  }

  if (payload.invoices.length) {
    const { error } = await supabase.from('invoices').insert(
      payload.invoices.map((i) => ({
        id: i.id,
        user_id: userId,
        number: i.number,
        client_id: i.clientId,
        quote_id: i.quoteId,
        linked_quote_no: i.linkedQuoteNo ?? null,
        issue_date: i.issueDate,
        due_date: i.dueDate,
        scope_lines: i.scopeLines,
        milestones: i.milestones,
        contract_total: i.contractTotal,
        withholding_enabled: i.withholdingEnabled,
        withholding_percent: i.withholdingPercent,
        terms_and_conditions: i.termsAndConditions,
        status: i.status,
        created_at: i.createdAt,
        updated_at: i.updatedAt,
      })),
    )
    if (error) throw error
  }

  if (payload.bankAccounts.length) {
    const { error } = await supabase.from('bank_accounts').insert(
      payload.bankAccounts.map((b) => ({
        id: b.id,
        user_id: userId,
        bank_preset_id: b.bankPresetId,
        custom_bank_name: b.customBankName,
        account_name: b.accountName,
        account_number: b.accountNumber,
        notes: b.notes,
      })),
    )
    if (error) throw error
  }
}

type DbProfileRow = {
  contractor_name: string
  business_name: string
  email: string
  phone: string
  address: string
  show_tin: boolean
  tin: string
}

type DbSettingsRow = {
  quote_prefix: string
  next_quote_number: number
  invoice_prefix: string
  next_invoice_number: number
  default_validity_days: number
  default_invoice_due_days: number
  default_terms: string
  default_scope: string
}

type DbClientRow = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  billing_address: string
  notes: string
  created_at: string
}

type DbQuoteRow = {
  id: string
  number: string
  client_id: string
  issue_date: string
  valid_until: string
  validity_days: number
  scope_lines: unknown
  milestones: unknown
  contract_total: number
  withholding_enabled: boolean
  withholding_percent: number
  terms_and_conditions: string
  status: string
  created_at: string
  updated_at: string
}

type DbInvoiceRow = {
  id: string
  number: string
  client_id: string
  quote_id: string | null
  linked_quote_no: string | null
  issue_date: string
  due_date: string
  scope_lines: unknown
  milestones: unknown
  contract_total: number
  withholding_enabled: boolean
  withholding_percent: number
  terms_and_conditions: string
  status: string
  created_at: string
  updated_at: string
}

type DbBankAccountRow = {
  id: string
  bank_preset_id: string
  custom_bank_name: string
  account_name: string
  account_number: string
  notes: string
}

const DEFAULT_TERMS = `1. This quotation is valid for the period stated on the cover page unless withdrawn earlier in writing.
2. Acceptance of this quotation constitutes agreement to the scope of work, milestones, and pricing described herein.
3. Payment is due according to the payment schedule. Late payments may incur reasonable reminders; work may be paused until accounts are current where agreed in writing.
4. Changes to scope may require a revised quotation or written change order.
5. Either party may terminate for material breach subject to notice and cure where applicable, as further agreed in the engagement letter or contract.`

const DEFAULT_SCOPE = `Describe the deliverables, boundaries, and assumptions for this engagement.`

export const DEFAULT_PROFILE: BusinessProfile = {
  contractorName: 'Your Name',
  businessName: '',
  email: '',
  phone: '',
  address: '',
  showTin: false,
  tin: '',
}

export const DEFAULT_SETTINGS: AppSettings = {
  quotePrefix: 'Q',
  nextQuoteNumber: 1,
  invoicePrefix: 'INV',
  nextInvoiceNumber: 1,
  defaultValidityDays: 30,
  defaultInvoiceDueDays: 30,
  defaultTerms: DEFAULT_TERMS,
  defaultScope: DEFAULT_SCOPE,
}

async function requireUserId(): Promise<string> {
  // Prefer local session (no network) to avoid transient /auth/v1/user 403s.
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
  if (sessionErr) throw sessionErr
  const sessionUserId = sessionData.session?.user?.id
  if (sessionUserId) return sessionUserId

  // Fallback to server validation.
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  const id = data.user?.id
  if (!id) throw new Error('Not authenticated.')
  return id
}

function toProfile(row: DbProfileRow | null): BusinessProfile {
  if (!row) return DEFAULT_PROFILE
  return {
    contractorName: row.contractor_name ?? DEFAULT_PROFILE.contractorName,
    businessName: row.business_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    showTin: Boolean(row.show_tin),
    tin: row.tin ?? '',
  }
}

function toSettings(row: DbSettingsRow | null): AppSettings {
  if (!row) return DEFAULT_SETTINGS
  return {
    quotePrefix: row.quote_prefix ?? 'Q',
    nextQuoteNumber: row.next_quote_number ?? 1,
    invoicePrefix: row.invoice_prefix ?? 'INV',
    nextInvoiceNumber: row.next_invoice_number ?? 1,
    defaultValidityDays: row.default_validity_days ?? 30,
    defaultInvoiceDueDays: row.default_invoice_due_days ?? 30,
    defaultTerms: row.default_terms ?? DEFAULT_TERMS,
    defaultScope: row.default_scope ?? DEFAULT_SCOPE,
  }
}

function toClient(row: DbClientRow): Client {
  return {
    id: row.id,
    name: row.name ?? '',
    company: row.company ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    billingAddress: row.billing_address ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at,
  }
}

function toQuote(row: DbQuoteRow): Quote {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    issueDate: row.issue_date,
    validUntil: row.valid_until,
    validityDays: row.validity_days,
    scopeLines: Array.isArray(row.scope_lines) ? (row.scope_lines as Quote['scopeLines']) : [],
    milestones: Array.isArray(row.milestones) ? (row.milestones as Quote['milestones']) : [],
    contractTotal: Number(row.contract_total ?? 0),
    withholdingEnabled: Boolean(row.withholding_enabled),
    withholdingPercent: Number(row.withholding_percent ?? 0),
    termsAndConditions: row.terms_and_conditions ?? '',
    status: row.status as Quote['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toInvoice(row: DbInvoiceRow): Invoice {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    quoteId: row.quote_id,
    linkedQuoteNo: row.linked_quote_no ?? null,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    scopeLines: Array.isArray(row.scope_lines) ? (row.scope_lines as Invoice['scopeLines']) : [],
    milestones: Array.isArray(row.milestones) ? (row.milestones as Invoice['milestones']) : [],
    contractTotal: Number(row.contract_total ?? 0),
    withholdingEnabled: Boolean(row.withholding_enabled),
    withholdingPercent: Number(row.withholding_percent ?? 0),
    termsAndConditions: row.terms_and_conditions ?? '',
    status: row.status as Invoice['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toBankAccount(row: DbBankAccountRow): BankAccount {
  return {
    id: row.id,
    bankPresetId: row.bank_preset_id ?? '',
    customBankName: row.custom_bank_name ?? '',
    accountName: row.account_name ?? '',
    accountNumber: row.account_number ?? '',
    notes: row.notes ?? '',
  }
}

export async function fetchAppData(): Promise<AppData> {
  const userId = await requireUserId()

  const [{ data: profileRow, error: profileErr }, { data: settingsRow, error: settingsErr }] =
    await Promise.all([
      supabase.from('app_profiles').select('*').eq('user_id', userId).maybeSingle<DbProfileRow>(),
      supabase.from('app_settings').select('*').eq('user_id', userId).maybeSingle<DbSettingsRow>(),
    ])

  const tableMissing =
    (profileErr as { status?: number } | null)?.status === 404 ||
    (settingsErr as { status?: number } | null)?.status === 404
  if (tableMissing) {
    throw new Error(
      'Supabase tables are missing. Run `supabase/schema.sql` in your Supabase SQL Editor, then refresh.',
    )
  }

  if (profileErr) throw profileErr
  if (settingsErr) throw settingsErr

  const [
    { data: clients, error: clientsErr },
    { data: quotes, error: quotesErr },
    { data: invoices, error: invoicesErr },
    { data: bankAccounts, error: bankErr },
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<DbClientRow[]>(),
    supabase
      .from('quotes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<DbQuoteRow[]>(),
    supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<DbInvoiceRow[]>(),
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .returns<DbBankAccountRow[]>(),
  ])

  const any404 =
    (clientsErr as { status?: number } | null)?.status === 404 ||
    (quotesErr as { status?: number } | null)?.status === 404 ||
    (invoicesErr as { status?: number } | null)?.status === 404 ||
    (bankErr as { status?: number } | null)?.status === 404
  if (any404) {
    throw new Error(
      'Supabase tables are missing. Run `supabase/schema.sql` in your Supabase SQL Editor, then refresh.',
    )
  }

  if (clientsErr) throw clientsErr
  if (quotesErr) throw quotesErr
  if (invoicesErr) throw invoicesErr
  if (bankErr) throw bankErr

  return {
    profile: toProfile(profileRow ?? null),
    settings: toSettings(settingsRow ?? null),
    clients: (clients ?? []).map(toClient),
    quotes: (quotes ?? []).map(toQuote),
    invoices: (invoices ?? []).map(toInvoice),
    bankAccounts: (bankAccounts ?? []).map(toBankAccount),
  }
}

export async function upsertProfile(profile: BusinessProfile) {
  const userId = await requireUserId()
  const { error } = await supabase.from('app_profiles').upsert({
    user_id: userId,
    contractor_name: profile.contractorName,
    business_name: profile.businessName,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    show_tin: profile.showTin,
    tin: profile.tin,
  })
  if (error) throw error
}

export async function upsertSettings(settings: AppSettings) {
  const userId = await requireUserId()
  const { error } = await supabase.from('app_settings').upsert({
    user_id: userId,
    quote_prefix: settings.quotePrefix,
    next_quote_number: settings.nextQuoteNumber,
    invoice_prefix: settings.invoicePrefix,
    next_invoice_number: settings.nextInvoiceNumber,
    default_validity_days: settings.defaultValidityDays,
    default_invoice_due_days: settings.defaultInvoiceDueDays ?? 30,
    default_terms: settings.defaultTerms,
    default_scope: settings.defaultScope,
  })
  if (error) throw error
}

export async function upsertClient(client: Client) {
  const userId = await requireUserId()
  const { error } = await supabase.from('clients').upsert({
    id: client.id,
    user_id: userId,
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    billing_address: client.billingAddress,
    notes: client.notes,
    created_at: client.createdAt,
  })
  if (error) throw error
}

export async function deleteClientRow(id: string) {
  await requireUserId()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

export async function upsertQuote(quote: Quote) {
  const userId = await requireUserId()
  const { error } = await supabase.from('quotes').upsert({
    id: quote.id,
    user_id: userId,
    number: quote.number,
    client_id: quote.clientId,
    issue_date: quote.issueDate,
    valid_until: quote.validUntil,
    validity_days: quote.validityDays,
    scope_lines: quote.scopeLines,
    milestones: quote.milestones,
    contract_total: quote.contractTotal,
    withholding_enabled: quote.withholdingEnabled,
    withholding_percent: quote.withholdingPercent,
    terms_and_conditions: quote.termsAndConditions,
    status: quote.status,
    created_at: quote.createdAt,
    updated_at: quote.updatedAt,
  })
  if (error) throw error
}

export async function deleteQuoteRow(id: string) {
  await requireUserId()
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) throw error
}

export async function upsertInvoice(inv: Invoice) {
  const userId = await requireUserId()
  const { error } = await supabase.from('invoices').upsert({
    id: inv.id,
    user_id: userId,
    number: inv.number,
    client_id: inv.clientId,
    quote_id: inv.quoteId,
    linked_quote_no: inv.linkedQuoteNo ?? null,
    issue_date: inv.issueDate,
    due_date: inv.dueDate,
    scope_lines: inv.scopeLines,
    milestones: inv.milestones,
    contract_total: inv.contractTotal,
    withholding_enabled: inv.withholdingEnabled,
    withholding_percent: inv.withholdingPercent,
    terms_and_conditions: inv.termsAndConditions,
    status: inv.status,
    created_at: inv.createdAt,
    updated_at: inv.updatedAt,
  })
  if (error) throw error
}

export async function deleteInvoiceRow(id: string) {
  await requireUserId()
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
}

export async function upsertBankAccountRow(row: BankAccount) {
  const userId = await requireUserId()
  const { error } = await supabase.from('bank_accounts').upsert({
    id: row.id,
    user_id: userId,
    bank_preset_id: row.bankPresetId,
    custom_bank_name: row.customBankName,
    account_name: row.accountName,
    account_number: row.accountNumber,
    notes: row.notes,
  })
  if (error) throw error
}

export async function deleteBankAccountRow(id: string) {
  await requireUserId()
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
  if (error) throw error
}

export async function rpcConsumeNextQuoteNumber(): Promise<string | null> {
  const { data, error } = await supabase.rpc('consume_next_quote_number')
  if (error) return null
  return typeof data === 'string' ? data : null
}

export async function rpcConsumeNextInvoiceNumber(): Promise<string | null> {
  const { data, error } = await supabase.rpc('consume_next_invoice_number')
  if (error) return null
  return typeof data === 'string' ? data : null
}

