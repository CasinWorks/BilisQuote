import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { formatDate, formatMoney } from '../lib/format'
import { netAfterWithholding } from '../lib/calculations'
import { downloadCsv, quotesToCsv } from '../lib/csv'

export function Quotes() {
  const quotes = useAppStore((s) => s.quotes)
  const clients = useAppStore((s) => s.clients)

  const exportCsv = () => {
    const csv = quotesToCsv(quotes, clients)
    downloadCsv(`quotes-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink-950">Quotations</h2>
          <p className="text-sm text-ink-600 mt-1">
            All issued quotes with status and totals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            Export CSV
          </button>
          <Link
            to="/quotes/new"
            className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            New quotation
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Quote</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Valid until</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Net</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-24" />
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-500">
                    No quotations yet.{' '}
                    <Link to="/quotes/new" className="text-accent font-medium hover:underline">
                      Create one
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                quotes.map((q) => {
                  const c = clients.find((x) => x.id === q.clientId)
                  const net = netAfterWithholding(
                    q.contractTotal,
                    q.withholdingEnabled,
                    q.withholdingPercent,
                  )
                  return (
                    <tr key={q.id} className="border-t border-ink-100">
                      <td className="px-4 py-3 font-medium text-ink-900">{q.number}</td>
                      <td className="px-4 py-3 text-ink-700">
                        {c ? c.company || c.name : 'Unknown client'}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-600">
                        {formatDate(q.issueDate)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-600">
                        {formatDate(q.validUntil)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(q.contractTotal)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(net)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium capitalize text-ink-700">
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/quotes/${q.id}`}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
