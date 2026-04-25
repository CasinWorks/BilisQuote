import type { AppBackupPayload } from './backup'

function escapeCell(s: string): string {
  const needsQuote = /[",\n\r]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsQuote ? `"${escaped}"` : escaped
}

/**
 * Full backup as CSV.
 * Format:
 *   header: app, payload_json
 *   row: quotation-generator, <JSON string>
 *
 * This stays “.csv” for portability, but still preserves nested structures.
 */
export function fullBackupToCsv(payload: AppBackupPayload): string {
  const header = ['app', 'payload_json']
  const row = ['quotation-generator', JSON.stringify(payload)]
  return [header, row].map((r) => r.map(escapeCell).join(',')).join('\n')
}

function parseSingleRowCsv(text: string): string[] | null {
  // Minimal CSV parser for two-column, one-row export:
  // handles quotes and commas/newlines inside quoted fields.
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  const pushCell = () => {
    row.push(cell)
    cell = ''
  }
  const pushRow = () => {
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1]
        if (next === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === ',') {
      pushCell()
      continue
    }
    if (ch === '\n') {
      pushCell()
      pushRow()
      continue
    }
    if (ch === '\r') continue
    cell += ch
  }

  pushCell()
  if (row.length > 0) pushRow()

  // Expect at least header + 1 data row
  if (rows.length < 2) return null
  const header = rows[0]
  const data = rows[1]
  const appIdx = header.indexOf('app')
  const payloadIdx = header.indexOf('payload_json')
  if (appIdx < 0 || payloadIdx < 0) return null
  return [data[appIdx] ?? '', data[payloadIdx] ?? '']
}

export function parseFullBackupCsv(text: string): { ok: true; payload: AppBackupPayload } | { ok: false; error: string } {
  const parsed = parseSingleRowCsv(text.trim())
  if (!parsed) return { ok: false, error: 'CSV format not recognized.' }
  const [app, payloadJson] = parsed
  if (app.trim() !== 'quotation-generator') {
    return { ok: false, error: 'This CSV is not a backup from this app.' }
  }
  try {
    const raw = JSON.parse(payloadJson) as AppBackupPayload
    return { ok: true, payload: raw }
  } catch {
    return { ok: false, error: 'CSV payload_json is not valid JSON.' }
  }
}

