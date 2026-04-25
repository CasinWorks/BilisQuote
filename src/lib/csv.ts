import type { Client, Invoice, Quote } from '../types'
import { formatDate } from './format'

function escapeCell(s: string): string {
  const needsQuote = /[",\n\r]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsQuote ? `"${escaped}"` : escaped
}

export function quotesToCsv(quotes: Quote[], clients: Client[]): string {
  const header = [
    'Type',
    'Number',
    'Client',
    'Issue date',
    'Valid until',
    'Contract total',
    'Withholding %',
    'Net',
    'Status',
  ]
  const rows = quotes.map((q) => {
    const c = clients.find((x) => x.id === q.clientId)
    const clientLabel = c ? (c.company || c.name) : q.clientId
    const net =
      q.contractTotal -
      (q.withholdingEnabled ? (q.contractTotal * q.withholdingPercent) / 100 : 0)
    return [
      'Quote',
      q.number,
      clientLabel,
      formatDate(q.issueDate),
      formatDate(q.validUntil),
      q.contractTotal.toFixed(2),
      q.withholdingEnabled ? String(q.withholdingPercent) : '0',
      net.toFixed(2),
      q.status,
    ]
  })
  return [header, ...rows].map((r) => r.map(escapeCell).join(',')).join('\n')
}

export function invoicesToCsv(invoices: Invoice[], clients: Client[]): string {
  const header = [
    'Type',
    'Number',
    'Client',
    'Issue date',
    'Due date',
    'Contract total',
    'Withholding %',
    'Net',
    'Status',
    'Linked quote no.',
  ]
  const rows = invoices.map((inv) => {
    const c = clients.find((x) => x.id === inv.clientId)
    const clientLabel = c ? (c.company || c.name) : inv.clientId
    const net =
      inv.contractTotal -
      (inv.withholdingEnabled ? (inv.contractTotal * inv.withholdingPercent) / 100 : 0)
    return [
      'Invoice',
      inv.number,
      clientLabel,
      formatDate(inv.issueDate),
      formatDate(inv.dueDate),
      inv.contractTotal.toFixed(2),
      inv.withholdingEnabled ? String(inv.withholdingPercent) : '0',
      net.toFixed(2),
      inv.status,
      inv.linkedQuoteNo ?? '',
    ]
  })
  return [header, ...rows].map((r) => r.map(escapeCell).join(',')).join('\n')
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
