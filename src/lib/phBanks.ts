/** Common Philippine banks for payment instructions (display labels). */
export const PRESET_PH_BANKS = [
  { id: 'BPI', label: 'Bank of the Philippine Islands (BPI)' },
  { id: 'RCBC', label: 'Rizal Commercial Banking Corporation (RCBC)' },
  { id: 'BDO', label: 'BDO Unibank' },
  { id: 'METROBANK', label: 'Metropolitan Bank & Trust Company (Metrobank)' },
  { id: 'UNIONBANK', label: 'Union Bank of the Philippines' },
  { id: 'CHINABANK', label: 'China Banking Corporation' },
  { id: 'LANDBANK', label: 'Land Bank of the Philippines' },
  { id: 'PNB', label: 'Philippine National Bank' },
  { id: 'SECURITY', label: 'Security Bank' },
  { id: 'AUB', label: 'Asia United Bank' },
  { id: 'EASTWEST', label: 'East West Banking Corporation' },
  { id: 'PSBANK', label: 'Philippine Savings Bank' },
  { id: 'OTHER', label: 'Other (type bank name)' },
] as const

export function labelForPreset(
  presetId: string,
  customBankName: string,
): string {
  if (presetId === 'OTHER' && customBankName.trim()) {
    return customBankName.trim()
  }
  const p = PRESET_PH_BANKS.find((b) => b.id === presetId)
  return p?.label ?? (customBankName.trim() || 'Bank')
}
