import { eachMonthOfInterval, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import type { Invoice, Quote } from '../types'

export type MonthlyPoint = {
  key: string
  label: string
  quotesTotal: number
  invoicesTotal: number
  combined: number
}

export function buildMonthlySeries(
  quotes: Quote[],
  invoices: Invoice[],
  monthsBack = 12,
): MonthlyPoint[] {
  const end = endOfMonth(new Date())
  const start = startOfMonth(subMonths(end, monthsBack - 1))
  const months = eachMonthOfInterval({ start, end })

  return months.map((m) => {
    const key = format(m, 'yyyy-MM')
    const label = format(m, 'MMM yyyy')

    const q = quotes
      .filter((x) => x.issueDate.startsWith(key))
      .reduce((s, x) => s + x.contractTotal, 0)

    const inv = invoices
      .filter((x) => x.issueDate.startsWith(key))
      .reduce((s, x) => s + x.contractTotal, 0)

    return {
      key,
      label,
      quotesTotal: q,
      invoicesTotal: inv,
      combined: q + inv,
    }
  })
}

export function sumYear(
  quotes: Quote[],
  invoices: Invoice[],
  year: number,
): { quotes: number; invoices: number } {
  const y = String(year)
  const q = quotes
    .filter((x) => x.issueDate.startsWith(y))
    .reduce((s, x) => s + x.contractTotal, 0)
  const inv = invoices
    .filter((x) => x.issueDate.startsWith(y))
    .reduce((s, x) => s + x.contractTotal, 0)
  return { quotes: q, invoices: inv }
}

export function forecastNextMonths(
  points: MonthlyPoint[],
  horizon = 3,
): { label: string; value: number }[] {
  const vals = points.map((p) => p.combined)
  if (vals.length < 2) {
    const last = vals[vals.length - 1] ?? 0
    return Array.from({ length: horizon }, (_, i) => ({
      label: `+${i + 1}m`,
      value: last,
    }))
  }
  const last3 = vals.slice(-3)
  const avg = last3.reduce((a, b) => a + b, 0) / last3.length
  const prev3 = vals.slice(-6, -3)
  const prevAvg =
    prev3.length > 0 ? prev3.reduce((a, b) => a + b, 0) / prev3.length : avg
  const growth = avg - prevAvg
  const out: { label: string; value: number }[] = []
  let v = last3[last3.length - 1] ?? 0
  for (let i = 0; i < horizon; i++) {
    v = Math.max(0, v + growth / 3)
    out.push({ label: `Forecast ${i + 1}`, value: v })
  }
  return out
}
