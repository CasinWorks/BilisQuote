import type { ScopeLineItem } from '../types'

export function newScopeLine(): ScopeLineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    details: '',
    amount: null,
  }
}

/** First row seeded from Settings → default scope template */
export function defaultScopeLinesFromTemplate(template: string): ScopeLineItem[] {
  return [
    {
      id: crypto.randomUUID(),
      description: '',
      details: template,
      amount: null,
    },
  ]
}

/** Load from saved quote/invoice: prefer scopeLines; migrate legacy scopeOfWork string */
export function resolveScopeLines(
  scopeLines: ScopeLineItem[] | undefined,
  legacyScopeOfWork: string | undefined,
): ScopeLineItem[] {
  if (scopeLines && scopeLines.length > 0) return scopeLines
  if (legacyScopeOfWork?.trim()) {
    return [
      {
        id: crypto.randomUUID(),
        description: '',
        details: legacyScopeOfWork,
        amount: null,
      },
    ]
  }
  return [newScopeLine()]
}
