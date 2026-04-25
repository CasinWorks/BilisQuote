import type {
  BankAccount,
  BusinessProfile,
  Client,
  Invoice,
  Quote,
  ScopeLineItem,
} from '../types'
import { labelForPreset } from '../lib/phBanks'
import { formatDate, formatMoney } from '../lib/format'
import {
  effectiveMilestonePercent,
  milestoneAmounts,
  netAfterWithholding,
  withholdingAmount,
} from '../lib/calculations'

type Props =
  | {
      kind: 'quote'
      profile: BusinessProfile
      client: Client
      doc: Quote
      bankAccounts?: BankAccount[]
    }
  | {
      kind: 'invoice'
      profile: BusinessProfile
      client: Client
      doc: Invoice
      linkedQuoteNo?: string | null
      bankAccounts?: BankAccount[]
    }

function scopeRowsForPdf(lines: ScopeLineItem[] | undefined): ScopeLineItem[] {
  if (lines && lines.length > 0) return lines
  return [
    {
      id: 'placeholder',
      description: '',
      details: '',
      amount: null,
    },
  ]
}

export function DocumentSheet(props: Props) {
  const { kind, profile, client, doc } = props
  const bankAccounts = props.bankAccounts ?? []
  const linkedQuoteNo =
    props.kind === 'invoice'
      ? props.linkedQuoteNo ?? (doc as Invoice).linkedQuoteNo ?? null
      : null
  const title = kind === 'quote' ? 'QUOTATION' : 'INVOICE'
  const amounts = milestoneAmounts(doc.contractTotal, doc.milestones)
  const wh = withholdingAmount(
    doc.contractTotal,
    doc.withholdingEnabled,
    doc.withholdingPercent,
  )
  const net = netAfterWithholding(
    doc.contractTotal,
    doc.withholdingEnabled,
    doc.withholdingPercent,
  )

  const secondaryLine =
    kind === 'quote'
      ? `Valid until: ${formatDate(doc.validUntil)} · Validity: ${doc.validityDays} days`
      : `Due date: ${formatDate(doc.dueDate)}`

  const scopeRows = scopeRowsForPdf(doc.scopeLines)

  return (
    <div className="w-[210mm] max-w-full bg-white text-ink-900 shadow-sm border border-ink-200 rounded-lg overflow-hidden print:shadow-none print:border-0">
      <div className="p-10 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b border-ink-200 pb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              {title}
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink-950">
              {profile.businessName || profile.contractorName}
            </h1>
            <p className="text-sm text-ink-600 mt-1 whitespace-pre-line">{profile.address}</p>
            <div className="mt-3 text-sm text-ink-700 space-y-0.5">
              {profile.email ? <p>{profile.email}</p> : null}
              {profile.phone ? <p>{profile.phone}</p> : null}
            </div>
            {profile.showTin && profile.tin ? (
              <p className="text-xs text-ink-500 mt-2">TIN: {profile.tin}</p>
            ) : null}
          </div>
          <div className="text-sm sm:text-right space-y-1">
            <p>
              <span className="text-ink-500">{kind === 'quote' ? 'Quote' : 'Invoice'} no.</span>{' '}
              <span className="font-semibold text-ink-900">{doc.number}</span>
            </p>
            <p>
              <span className="text-ink-500">Issue date:</span>{' '}
              {formatDate(doc.issueDate)}
            </p>
            <p className="text-ink-600">{secondaryLine}</p>
            {kind === 'invoice' && linkedQuoteNo ? (
              <p className="text-xs text-ink-400">Linked quote: {linkedQuoteNo}</p>
            ) : null}
          </div>
        </header>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Bill to</h2>
          <div className="mt-2 rounded-lg bg-ink-50 border border-ink-100 p-4 text-sm">
            <p className="font-semibold text-ink-900">{client.company || client.name}</p>
            <p className="text-ink-700">{client.name}</p>
            <p className="text-ink-600 mt-2 whitespace-pre-line">{client.billingAddress}</p>
            <div className="mt-2 text-ink-600 space-y-0.5">
              {client.email ? <p>{client.email}</p> : null}
              {client.phone ? <p>{client.phone}</p> : null}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">
            Scope of work
          </h2>
          <div className="overflow-hidden rounded border border-zinc-300">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-3 py-2.5 text-left font-semibold uppercase text-[11px] tracking-wide w-[28%]">
                    Description
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase text-[11px] tracking-wide">
                    Details
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold uppercase text-[11px] tracking-wide w-[30%] min-w-[7rem]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {scopeRows.map((row, i) => {
                  const desc = row.description.trim() || '—'
                  const det = row.details.trim() || '—'
                  const showAmt =
                    row.amount != null && Number.isFinite(row.amount) && row.amount >= 0
                  return (
                    <tr
                      key={row.id}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}
                    >
                      <td className="px-3 py-2.5 align-top border-t border-zinc-200 text-ink-900">
                        {desc}
                      </td>
                      <td className="px-3 py-2.5 align-top border-t border-zinc-200 text-ink-700">
                        {det}
                      </td>
                      <td className="px-3 py-2.5 align-top border-t border-zinc-200 text-right tabular-nums font-semibold text-ink-900">
                        {showAmt ? formatMoney(row.amount!) : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 px-3 py-3 border-t-2 border-black bg-white">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Total contract value
              </span>
              <span className="text-xl font-bold tabular-nums text-ink-950 sm:text-right">
                {formatMoney(doc.contractTotal)}
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Payment schedule (milestones)
          </h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-ink-200">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Milestone</th>
                  <th className="px-4 py-2 font-medium w-24 text-right">%</th>
                  <th className="px-4 py-2 font-medium w-36 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {doc.milestones.map((m, i) => (
                  <tr key={m.id} className="border-t border-ink-100">
                    <td className="px-4 py-2.5">{m.label || `Milestone ${i + 1}`}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {effectiveMilestonePercent(m, doc.contractTotal).toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      {formatMoney(amounts.find((a) => a.id === m.id)?.amount ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {bankAccounts.length > 0 ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Payment instructions
            </h2>
            <p className="mt-2 text-xs text-ink-600">
              Please remit payments to the following (Philippine bank transfer / deposit as applicable):
            </p>
            <ul className="mt-3 space-y-4 text-sm">
              {bankAccounts.map((b) => (
                <li
                  key={b.id}
                  className="rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-3"
                >
                  <p className="font-semibold text-ink-900">
                    {labelForPreset(b.bankPresetId, b.customBankName)}
                  </p>
                  <p className="mt-1 text-ink-700">
                    <span className="text-ink-500">Account name:</span> {b.accountName}
                  </p>
                  <p className="mt-0.5 font-mono tabular-nums text-ink-800">
                    <span className="text-ink-500 font-sans">Account no.:</span> {b.accountNumber}
                  </p>
                  {b.notes.trim() ? (
                    <p className="mt-1 text-xs text-ink-600">{b.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="flex flex-col sm:flex-row sm:justify-end">
          <div className="w-full sm:max-w-sm space-y-2 text-sm">
            <div className="flex justify-between gap-8">
              <span className="text-ink-600">Contract total</span>
              <span className="font-semibold tabular-nums">{formatMoney(doc.contractTotal)}</span>
            </div>
            {doc.withholdingEnabled ? (
              <div className="flex justify-between gap-8 text-ink-700">
                <span>
                  Withholding tax ({doc.withholdingPercent.toFixed(2)}%)
                </span>
                <span className="tabular-nums">− {formatMoney(wh)}</span>
              </div>
            ) : (
              <div className="flex justify-between gap-8 text-ink-500 text-xs italic">
                <span>Withholding tax</span>
                <span>Not applicable</span>
              </div>
            )}
            <div className="flex justify-between gap-8 border-t border-ink-200 pt-3 font-semibold text-base">
              <span>Net amount</span>
              <span className="tabular-nums">{formatMoney(net)}</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Terms & conditions
          </h2>
          <p className="mt-2 text-xs text-ink-700 whitespace-pre-wrap leading-relaxed">
            {doc.termsAndConditions}
          </p>
        </section>

        <footer className="pt-4 border-t border-ink-100 text-xs text-ink-400">
          <span>
            Prepared by {profile.contractorName}
            {profile.businessName ? ` · ${profile.businessName}` : ''}
          </span>
        </footer>
      </div>
    </div>
  )
}
