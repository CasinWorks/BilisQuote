import type { Milestone } from '../types'

export function milestoneAmountForRow(m: Milestone, contractTotal: number): number {
  if (
    m.fixedAmount != null &&
    Number.isFinite(m.fixedAmount) &&
    m.fixedAmount >= 0
  ) {
    return m.fixedAmount
  }
  const p = Number.isFinite(m.percent) ? m.percent : 0
  return (contractTotal * p) / 100
}

export function milestoneAmounts(
  contractTotal: number,
  milestones: Milestone[],
): { amount: number; id: string }[] {
  return milestones.map((m) => ({
    id: m.id,
    amount: milestoneAmountForRow(m, contractTotal),
  }))
}

/** % implied by each row’s amount vs contract total (fixed amount or percent-based). */
export function effectiveMilestonePercent(
  m: Milestone,
  contractTotal: number,
): number {
  if (contractTotal <= 0) return Number.isFinite(m.percent) ? m.percent : 0
  return (milestoneAmountForRow(m, contractTotal) / contractTotal) * 100
}

export function sumEffectivePercents(
  milestones: Milestone[],
  contractTotal: number,
): number {
  return milestones.reduce(
    (s, m) => s + effectiveMilestonePercent(m, contractTotal),
    0,
  )
}

export function sumScheduledAmounts(
  milestones: Milestone[],
  contractTotal: number,
): number {
  return milestones.reduce(
    (s, m) => s + milestoneAmountForRow(m, contractTotal),
    0,
  )
}

export function withholdingAmount(
  contractTotal: number,
  enabled: boolean,
  percent: number,
): number {
  if (!enabled) return 0
  const p = Number.isFinite(percent) ? percent : 0
  return (contractTotal * p) / 100
}

export function netAfterWithholding(
  contractTotal: number,
  enabled: boolean,
  withholdingPercent: number,
): number {
  return contractTotal - withholdingAmount(contractTotal, enabled, withholdingPercent)
}
