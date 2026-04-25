import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '../lib/format'
import { buildMonthlySeries, forecastNextMonths, sumYear } from '../lib/analytics'
import { useAppStore } from '../store/useAppStore'

export function Dashboard() {
  const quotes = useAppStore((s) => s.quotes)
  const invoices = useAppStore((s) => s.invoices)

  const year = new Date().getFullYear()
  const series = useMemo(() => buildMonthlySeries(quotes, invoices, 12), [quotes, invoices])
  const ytd = useMemo(() => sumYear(quotes, invoices, year), [quotes, invoices, year])
  const forecast = useMemo(() => forecastNextMonths(series, 3), [series])

  const totalThisMonth =
    series[series.length - 1]?.combined ?? 0
  const totalAllTime =
    quotes.reduce((s, q) => s + q.contractTotal, 0) +
    invoices.reduce((s, i) => s + i.contractTotal, 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-950">Dashboard</h2>
        <p className="text-sm text-ink-600 mt-1">
          Track quoted and invoiced value, monthly cash flow, and a simple forward forecast.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Quotes (YTD)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink-950">
            {formatMoney(ytd.quotes)}
          </p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Invoices (YTD)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink-950">
            {formatMoney(ytd.invoices)}
          </p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">This month</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink-950">
            {formatMoney(totalThisMonth)}
          </p>
          <p className="text-xs text-ink-500 mt-1">Quotes + invoices combined</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">All-time total</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink-950">
            {formatMoney(totalAllTime)}
          </p>
          <p className="text-xs text-ink-500 mt-1">{quotes.length} quotes · {invoices.length} invoices</p>
        </div>
      </div>

      <div className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-950">Money flow</h3>
            <p className="text-sm text-ink-600">
              Last 12 months (sum of quote and invoice totals by issue date). If you record both a quote and
              an invoice for the same job in the same month, combined totals will reflect both — use the
              breakdown lines to compare.
            </p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`
                }
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
              />
              <Tooltip
                formatter={(value) =>
                  typeof value === 'number' ? formatMoney(value) : ''
                }
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="combined"
                name="Combined"
                fill="#bfdbfe"
                stroke="#2563eb"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="quotesTotal"
                name="Quotes"
                stroke="#0f172a"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="invoicesTotal"
                name="Invoices"
                stroke="#059669"
                strokeWidth={1.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold text-ink-950">Simple forecast</h3>
          <p className="text-sm text-ink-600 mt-1 mb-4">
            Based on recent combined monthly totals (not a tax or accounting projection).
          </p>
          <ul className="space-y-2">
            {forecast.map((f) => (
              <li
                key={f.label}
                className="flex justify-between text-sm border-b border-ink-100 pb-2 last:border-0"
              >
                <span className="text-ink-600">{f.label}</span>
                <span className="font-medium tabular-nums">{formatMoney(f.value)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-center">
          <h3 className="font-display text-lg font-semibold text-ink-950">Quick actions</h3>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/quotes/new"
              className="inline-flex justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
            >
              New quotation
            </Link>
            <Link
              to="/invoices/new"
              className="inline-flex justify-center rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-50 transition-colors"
            >
              New invoice
            </Link>
            <Link
              to="/clients"
              className="inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-accent hover:underline"
            >
              Manage clients
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
