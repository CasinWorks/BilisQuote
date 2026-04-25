import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { formatDate, formatMoney } from '../lib/format'
import { netAfterWithholding } from '../lib/calculations'
import { downloadCsv, invoicesToCsv } from '../lib/csv'

export function Invoices() {
  const invoices = useAppStore((s) => s.invoices)
  const clients = useAppStore((s) => s.clients)

  const exportCsv = () => {
    const csv = invoicesToCsv(invoices, clients)
    downloadCsv(`invoices-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink-950">Invoices</h2>
          <p className="text-sm text-ink-600 mt-1">
            Bill clients with the same milestone layout as quotations.
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
            to="/invoices/new"
            className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            New invoice
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Net</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-24" />
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-500">
                    No invoices yet.{' '}
                    <Link to="/invoices/new" className="text-accent font-medium hover:underline">
                      Create one
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const c = clients.find((x) => x.id === inv.clientId)
                  const net = netAfterWithholding(
                    inv.contractTotal,
                    inv.withholdingEnabled,
                    inv.withholdingPercent,
                  )
                  return (
                    <tr key={inv.id} className="border-t border-ink-100">
                      <td className="px-4 py-3 font-medium text-ink-900">{inv.number}</td>
                      <td className="px-4 py-3 text-ink-700">
                        {c ? c.company || c.name : 'Unknown client'}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-600">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-600">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(inv.contractTotal)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(net)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium capitalize text-ink-700">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/invoices/${inv.id}`}
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
