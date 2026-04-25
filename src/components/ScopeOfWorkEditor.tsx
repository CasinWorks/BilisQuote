import type { ScopeLineItem } from '../types'
import { formatMoney } from '../lib/format'
import { newScopeLine } from '../lib/scope'

type Props = {
  lines: ScopeLineItem[]
  contractTotal: number
  onChange: (lines: ScopeLineItem[]) => void
}

export function ScopeOfWorkEditor({ lines, contractTotal, onChange }: Props) {
  const update = (id: string, patch: Partial<ScopeLineItem>) => {
    onChange(lines.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    onChange([...lines, newScopeLine()])
  }

  const removeRow = (id: string) => {
    if (lines.length <= 1) return
    onChange(lines.filter((r) => r.id !== id))
  }

  const onAmountChange = (id: string, raw: string) => {
    const t = raw.trim()
    if (t === '') {
      update(id, { amount: null })
      return
    }
    const v = Number.parseFloat(t)
    if (!Number.isFinite(v) || v < 0) return
    update(id, { amount: v })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-600">
        Table matches your PDF: <strong>Description</strong>, <strong>Details</strong>, and optional{' '}
        <strong>Amount</strong> per line. Total contract value still comes from the field above.
      </p>
      <div className="overflow-x-auto rounded-lg border border-ink-200">
        <table className="min-w-full text-sm">
          <thead className="bg-ink-900 text-left text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Description</th>
              <th className="px-3 py-2.5 font-semibold min-w-[12rem]">Details</th>
              <th className="px-3 py-2.5 font-semibold text-right w-36">Amount</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {lines.map((row, i) => (
              <tr
                key={row.id}
                className={i % 2 === 0 ? 'bg-white' : 'bg-ink-50/80'}
              >
                <td className="px-3 py-2 align-top border-t border-ink-200">
                  <input
                    className="w-full rounded border border-ink-200 px-2 py-1.5 text-sm"
                    value={row.description}
                    onChange={(e) => update(row.id, { description: e.target.value })}
                    placeholder="e.g. Andon System Development"
                  />
                </td>
                <td className="px-3 py-2 align-top border-t border-ink-200">
                  <textarea
                    rows={2}
                    className="w-full rounded border border-ink-200 px-2 py-1.5 text-sm leading-relaxed min-h-[2.75rem]"
                    value={row.details}
                    onChange={(e) => update(row.id, { details: e.target.value })}
                    placeholder="Scope details…"
                  />
                </td>
                <td className="px-3 py-2 align-top border-t border-ink-200">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full rounded border border-ink-200 px-2 py-1.5 text-sm tabular-nums text-right"
                    value={row.amount ?? ''}
                    placeholder="—"
                    onChange={(e) => onAmountChange(row.id, e.target.value)}
                  />
                </td>
                <td className="px-1 py-2 align-top border-t border-ink-200">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-xs text-ink-400 hover:text-red-600"
                    aria-label="Remove row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={addRow}
          className="font-medium text-accent hover:underline"
        >
          + Add line
        </button>
        <span className="text-ink-500">
          Contract total (for milestones & footer):{' '}
          <strong className="text-ink-800 tabular-nums">{formatMoney(contractTotal)}</strong>
        </span>
      </div>
    </div>
  )
}
