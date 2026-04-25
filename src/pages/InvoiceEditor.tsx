import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Invoice, InvoiceStatus, Milestone, Quote, ScopeLineItem } from '../types'
import { useAppStore } from '../store/useAppStore'
import { addDaysISO, formatDate, formatMoney } from '../lib/format'
import { netAfterWithholding, withholdingAmount } from '../lib/calculations'
import { defaultScopeLinesFromTemplate, resolveScopeLines } from '../lib/scope'
import { DocumentSheet } from '../components/DocumentSheet'
import { MilestoneEditor } from '../components/MilestoneEditor'
import { ScopeOfWorkEditor } from '../components/ScopeOfWorkEditor'
import { downloadElementAsPdf } from '../lib/pdf'

const defaultMilestones = (): Milestone[] => [
  { id: crypto.randomUUID(), label: 'Project completion', percent: 100 },
]

export function InvoiceEditor() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const fromQuoteId = searchParams.get('fromQuote')
  const navigate = useNavigate()

  const profile = useAppStore((s) => s.profile)
  const settings = useAppStore((s) => s.settings)
  const clients = useAppStore((s) => s.clients)
  const bankAccounts = useAppStore((s) => s.bankAccounts)
  const quotes = useAppStore((s) => s.quotes)
  const invoices = useAppStore((s) => s.invoices)
  const addInvoice = useAppStore((s) => s.addInvoice)
  const updateInvoice = useAppStore((s) => s.updateInvoice)
  const deleteInvoice = useAppStore((s) => s.deleteInvoice)

  const isNew = id === 'new'
  const existing = useMemo(() => invoices.find((i) => i.id === id), [invoices, id])
  const sourceQuote = useMemo(
    () => (fromQuoteId ? quotes.find((q) => q.id === fromQuoteId) : undefined),
    [fromQuoteId, quotes],
  )

  const pdfRef = useRef<HTMLDivElement>(null)
  const [pdfBusy, setPdfBusy] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const dueDays = settings.defaultInvoiceDueDays ?? 30

  const [clientId, setClientId] = useState('')
  const [number, setNumber] = useState('')
  const [quoteId, setQuoteId] = useState<string | null>(null)
  const [linkedQuoteNo, setLinkedQuoteNo] = useState<string | null>(null)
  const [issueDate, setIssueDate] = useState(today)
  const [dueDate, setDueDate] = useState(addDaysISO(today, dueDays))
  const [scopeLines, setScopeLines] = useState<ScopeLineItem[]>(() =>
    defaultScopeLinesFromTemplate(settings.defaultScope),
  )
  const [milestones, setMilestones] = useState<Milestone[]>(defaultMilestones)
  const [contractTotal, setContractTotal] = useState(0)
  const [withholdingEnabled, setWithholdingEnabled] = useState(false)
  const [withholdingPercent, setWithholdingPercent] = useState(2)
  const [termsAndConditions, setTermsAndConditions] = useState(settings.defaultTerms)
  const [status, setStatus] = useState<InvoiceStatus>('draft')

  useEffect(() => {
    if (!isNew && existing) {
      setClientId(existing.clientId)
      setNumber(existing.number)
      setQuoteId(existing.quoteId)
      setLinkedQuoteNo(existing.linkedQuoteNo ?? null)
      setIssueDate(existing.issueDate)
      setDueDate(existing.dueDate)
      setScopeLines(
        resolveScopeLines(
          existing.scopeLines,
          (existing as Invoice & { scopeOfWork?: string }).scopeOfWork,
        ),
      )
      setMilestones(existing.milestones.length ? existing.milestones : defaultMilestones())
      setContractTotal(existing.contractTotal)
      setWithholdingEnabled(existing.withholdingEnabled)
      setWithholdingPercent(existing.withholdingPercent)
      setTermsAndConditions(existing.termsAndConditions)
      setStatus(existing.status)
    }
  }, [isNew, existing])

  useEffect(() => {
    if (isNew && sourceQuote) {
      setClientId(sourceQuote.clientId)
      setQuoteId(sourceQuote.id)
      setLinkedQuoteNo(sourceQuote.number ?? null)
      setScopeLines(
        resolveScopeLines(
          sourceQuote.scopeLines,
          (sourceQuote as Quote & { scopeOfWork?: string }).scopeOfWork,
        ),
      )
      setMilestones(
        sourceQuote.milestones.length ? sourceQuote.milestones : defaultMilestones(),
      )
      setContractTotal(sourceQuote.contractTotal)
      setWithholdingEnabled(sourceQuote.withholdingEnabled)
      setWithholdingPercent(sourceQuote.withholdingPercent)
      setTermsAndConditions(sourceQuote.termsAndConditions)
    }
  }, [isNew, sourceQuote])

  useEffect(() => {
    setDueDate(addDaysISO(issueDate, dueDays))
  }, [issueDate, dueDays])

  const client = clients.find((c) => c.id === clientId)

  const previewInvoice: Invoice | null = useMemo(() => {
    if (!clientId) return null
    return {
      id: existing?.id ?? 'preview',
      number: number || 'PREVIEW',
      clientId,
      quoteId,
      linkedQuoteNo,
      issueDate,
      dueDate,
      scopeLines,
      milestones,
      contractTotal,
      withholdingEnabled,
      withholdingPercent,
      termsAndConditions,
      status,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }, [
    clientId,
    number,
    existing?.id,
    existing?.createdAt,
    quoteId,
    linkedQuoteNo,
    issueDate,
    dueDate,
    scopeLines,
    milestones,
    contractTotal,
    withholdingEnabled,
    withholdingPercent,
    termsAndConditions,
    status,
  ])

  const save = () => {
    if (!clientId || !previewInvoice) return
    if (isNew) {
      const inv = addInvoice({
        clientId,
        quoteId,
        linkedQuoteNo,
        issueDate,
        dueDate,
        scopeLines,
        milestones,
        contractTotal,
        withholdingEnabled,
        withholdingPercent,
        termsAndConditions,
        status,
      })
      navigate(`/invoices/${inv.id}`)
    } else if (existing) {
      updateInvoice(existing.id, {
        clientId,
        quoteId,
        linkedQuoteNo,
        issueDate,
        dueDate,
        scopeLines,
        milestones,
        contractTotal,
        withholdingEnabled,
        withholdingPercent,
        termsAndConditions,
        status,
      })
    }
  }

  const savePdf = async () => {
    if (!pdfRef.current || !previewInvoice || !client) return
    setPdfBusy(true)
    try {
      await downloadElementAsPdf(
        pdfRef.current,
        `invoice-${previewInvoice.number.replace(/[^\w.-]+/g, '_')}.pdf`,
      )
    } finally {
      setPdfBusy(false)
    }
  }

  if (!isNew && !existing) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-600">Invoice not found.</p>
        <Link to="/invoices" className="text-accent font-medium mt-2 inline-block">
          Back to list
        </Link>
      </div>
    )
  }

  const net = netAfterWithholding(contractTotal, withholdingEnabled, withholdingPercent)
  const wh = withholdingAmount(contractTotal, withholdingEnabled, withholdingPercent)

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink-950">
            {isNew ? 'New invoice' : `Invoice ${number}`}
          </h2>
          <p className="text-sm text-ink-600 mt-1">
            Use the same structure as quotations. Link an accepted quote when applicable.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/invoices"
            className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            Back
          </Link>
          {!isNew && existing ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this invoice?')) {
                  deleteInvoice(existing.id)
                  navigate('/invoices')
                }
              }}
              className="rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={!clientId}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={savePdf}
            disabled={!clientId || !client || pdfBusy}
            className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50"
          >
            {pdfBusy ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-semibold text-ink-950">Basics</h3>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-600">Client *</span>
              <select
                className="rounded-md border border-ink-200 px-3 py-2 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Select client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company || c.name}
                  </option>
                ))}
              </select>
            </label>
            {!isNew ? (
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-600">Invoice number</span>
                <input
                  className="rounded-md border border-ink-200 px-3 py-2 text-sm bg-ink-50"
                  value={number}
                  readOnly
                />
              </label>
            ) : (
              <p className="text-xs text-ink-500">
                Next number: {settings.invoicePrefix}-
                {String(settings.nextInvoiceNumber).padStart(4, '0')}.
              </p>
            )}
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-600">Link to quotation (optional)</span>
              <select
                className="rounded-md border border-ink-200 px-3 py-2 text-sm"
                value={quoteId ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) {
                    setQuoteId(null)
                    setLinkedQuoteNo(null)
                    return
                  }
                  const q = quotes.find((x) => x.id === v)
                  setQuoteId(v)
                  setLinkedQuoteNo(q?.number ?? null)
                }}
              >
                <option value="">None</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number} · {formatDate(q.issueDate)}
                  </option>
                ))}
              </select>
            </label>
            {linkedQuoteNo ? (
              <p className="text-xs text-ink-500">
                Linked quote reference: <strong>{linkedQuoteNo}</strong>
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-600">Issue date</span>
                <input
                  type="date"
                  className="rounded-md border border-ink-200 px-3 py-2 text-sm"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-600">Due date</span>
                <input
                  type="date"
                  className="rounded-md border border-ink-200 px-3 py-2 text-sm"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-600">Status</span>
              <select
                className="rounded-md border border-ink-200 px-3 py-2 text-sm capitalize"
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              >
                <option value="draft">draft</option>
                <option value="sent">sent</option>
                <option value="paid">paid</option>
                <option value="overdue">overdue</option>
                <option value="cancelled">cancelled</option>
              </select>
            </label>
          </section>

          <section className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-semibold text-ink-950">Commercials</h3>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-600">Contract total (PHP)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                className="rounded-md border border-ink-200 px-3 py-2 text-sm tabular-nums"
                value={Number.isFinite(contractTotal) ? contractTotal : 0}
                onChange={(e) => setContractTotal(Number.parseFloat(e.target.value) || 0)}
              />
            </label>
            <MilestoneEditor
              milestones={milestones}
              contractTotal={contractTotal}
              onChange={setMilestones}
            />
            <div className="rounded-lg bg-ink-50 border border-ink-100 p-4 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={withholdingEnabled}
                  onChange={(e) => setWithholdingEnabled(e.target.checked)}
                />
                <span>Apply withholding tax</span>
              </label>
              {withholdingEnabled ? (
                <label className="flex flex-col gap-1 pl-6">
                  <span className="text-ink-600">Withholding rate (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    className="max-w-xs rounded-md border border-ink-200 px-3 py-2 text-sm"
                    value={withholdingPercent}
                    onChange={(e) =>
                      setWithholdingPercent(Number.parseFloat(e.target.value) || 0)
                    }
                  />
                </label>
              ) : null}
              <div className="pt-2 border-t border-ink-200 space-y-1 tabular-nums">
                <div className="flex justify-between">
                  <span className="text-ink-600">Withholding</span>
                  <span>{withholdingEnabled ? formatMoney(wh) : '—'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Net after withholding</span>
                  <span>{formatMoney(net)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-semibold text-ink-950">Scope & terms</h3>
            <div className="space-y-2">
              <span className="text-sm text-ink-600">Scope of work</span>
              <ScopeOfWorkEditor
                lines={scopeLines}
                contractTotal={contractTotal}
                onChange={setScopeLines}
              />
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-600">Terms & conditions</span>
              <textarea
                rows={10}
                className="rounded-md border border-ink-200 px-3 py-2 text-xs leading-relaxed"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
              />
            </label>
          </section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 self-start">
          <p className="text-sm font-medium text-ink-700">Live preview</p>
          <div ref={pdfRef} className="print-root">
            {previewInvoice && client ? (
              <DocumentSheet
                kind="invoice"
                profile={profile}
                client={client}
                doc={previewInvoice}
                linkedQuoteNo={linkedQuoteNo}
                bankAccounts={bankAccounts}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-ink-300 p-8 text-center text-sm text-ink-500">
                Select a client to render the document.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
