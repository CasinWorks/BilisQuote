import { useEffect } from 'react'
import type { Milestone } from '../types'
import { formatMoney } from '../lib/format'
import {
  effectiveMilestonePercent,
  milestoneAmountForRow,
  sumEffectivePercents,
  sumScheduledAmounts,
} from '../lib/calculations'

type Props = {
  milestones: Milestone[]
  contractTotal: number
  onChange: (rows: Milestone[]) => void
}

export function MilestoneEditor({ milestones, contractTotal, onChange }: Props) {
  const totalPct = sumEffectivePercents(milestones, contractTotal)
  const scheduledTotal = sumScheduledAmounts(milestones, contractTotal)
  const contractDiff = contractTotal - scheduledTotal

  /** Keep stored % in sync when contract total changes and a row uses an exact amount */
  useEffect(() => {
    if (contractTotal <= 0) return
    let changed = false
    const next = milestones.map((m) => {
      if (m.fixedAmount != null && Number.isFinite(m.fixedAmount) && m.fixedAmount >= 0) {
        const pct = (m.fixedAmount / contractTotal) * 100
        if (Math.abs((m.percent ?? 0) - pct) > 0.001) {
          changed = true
          return { ...m, percent: pct }
        }
      }
      return m
    })
    if (changed) onChange(next)
  }, [contractTotal, milestones, onChange])

  const update = (id: string, patch: Partial<Milestone>) => {
    onChange(milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  const addRow = () => {
    onChange([
      ...milestones,
      {
        id: crypto.randomUUID(),
        label: '',
        percent: 0,
        fixedAmount: null,
      },
    ])
  }

  const removeRow = (id: string) => {
    onChange(milestones.filter((m) => m.id !== id))
  }

  const onPercentChange = (m: Milestone, raw: string) => {
    const v = Number.parseFloat(raw)
    const pct = Number.isFinite(v) ? v : 0
    update(m.id, { percent: pct, fixedAmount: null })
  }

  const onAmountChange = (m: Milestone, raw: string) => {
    const v = Number.parseFloat(raw)
    if (!Number.isFinite(v) || v < 0) return
    const pct =
      contractTotal > 0 ? (v / contractTotal) * 100 : 0
    update(m.id, { fixedAmount: v, percent: pct })
  }

  const clearExactAmount = (id: string) => {
    const m = milestones.find((x) => x.id === id)
    if (!m) return
    update(id, { fixedAmount: null })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-600">
          <strong>%</strong> splits the contract, or enter an <strong>amount</strong> only (e.g. downpayment)
          — <strong>% fills in automatically</strong> from that amount and the contract total. You do not
          need to type % if you only know the peso figure.
        </p>
        <button
          type="button"
          onClick={addRow}
          className="text-sm font-medium text-accent hover:underline"
        >
          + Add milestone
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-ink-200">
        <table className="min-w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-3 py-2 font-medium">Milestone</th>
              <th className="px-3 py-2 font-medium w-32">%</th>
              <th className="px-3 py-2 font-medium w-40 text-right">Amount (PHP)</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {milestones.map((m) => {
              const rowAmount = milestoneAmountForRow(m, contractTotal)
              const pctDisplay = effectiveMilestonePercent(m, contractTotal)
              const hasFixed =
                m.fixedAmount != null &&
                Number.isFinite(m.fixedAmount) &&
                m.fixedAmount >= 0

              const pctNeedsContract = hasFixed && contractTotal <= 0
              const pctReadOnly = hasFixed

              return (
                <tr key={m.id} className="border-t border-ink-100">
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded-md border border-ink-200 px-2 py-1.5 text-sm"
                      value={m.label}
                      onChange={(e) => update(m.id, { label: e.target.value })}
                      placeholder="e.g. Downpayment"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      readOnly={pctReadOnly}
                      className={
                        pctReadOnly
                          ? 'w-full rounded-md border border-ink-200 bg-ink-50 px-2 py-1.5 text-sm tabular-nums text-ink-700 cursor-not-allowed'
                          : 'w-full rounded-md border border-ink-200 px-2 py-1.5 text-sm tabular-nums'
                      }
                      value={
                        pctNeedsContract
                          ? ''
                          : Number.isFinite(pctDisplay)
                            ? pctDisplay
                            : 0
                      }
                      placeholder={pctNeedsContract ? 'Auto' : undefined}
                      {...(pctReadOnly
                        ? {}
                        : {
                            onChange: (e) => onPercentChange(m, e.target.value),
                          })}
                      title={
                        hasFixed
                          ? 'Auto-filled from amount ÷ contract total. Use “Use % instead” to type % yourself.'
                          : undefined
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-end gap-0.5">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-full max-w-[11rem] rounded-md border border-ink-200 px-2 py-1.5 text-sm tabular-nums text-right"
                        value={rowAmount}
                        onChange={(e) => onAmountChange(m, e.target.value)}
                      />
                      {hasFixed ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-700 font-medium">Exact amount</span>
                          <button
                            type="button"
                            onClick={() => clearExactAmount(m.id)}
                            className="text-[10px] font-medium text-accent hover:underline"
                          >
                            Use % instead
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-1 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(m.id)}
                      className="text-xs text-ink-400 hover:text-red-600"
                      aria-label="Remove milestone"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        {contractTotal <= 0 ? (
          <span className="text-amber-700">
            Set a <strong>contract total</strong> above so % can be calculated from any exact amounts you
            entered.
          </span>
        ) : null}
        <span
          className={
            Math.abs(totalPct - 100) < 0.02 ? 'text-emerald-700' : 'text-amber-700'
          }
        >
          Milestone % total: {contractTotal > 0 ? `${totalPct.toFixed(2)}%` : '—'}
          {contractTotal > 0 && Math.abs(totalPct - 100) >= 0.02
            ? ' · Usually sums to 100%'
            : ''}
        </span>
        <span
          className={
            Math.abs(contractDiff) < 0.02 ? 'text-ink-600' : 'text-amber-700'
          }
        >
          Scheduled amounts: {formatMoney(scheduledTotal)} · Contract: {formatMoney(contractTotal)}
          {Math.abs(contractDiff) >= 0.02 ? (
            <> · Difference: {formatMoney(contractDiff)}</>
          ) : null}
        </span>
      </div>
    </div>
  )
}
