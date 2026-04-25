import { useState } from 'react'
import type { BankAccount } from '../types'
import { useAppStore } from '../store/useAppStore'
import { PRESET_PH_BANKS, labelForPreset } from '../lib/phBanks'

const emptyForm = (): Omit<BankAccount, 'id'> => ({
  bankPresetId: 'BPI',
  customBankName: '',
  accountName: '',
  accountNumber: '',
  notes: '',
})

export function BankDetails() {
  const bankAccounts = useAppStore((s) => s.bankAccounts)
  const addBankAccount = useAppStore((s) => s.addBankAccount)
  const updateBankAccount = useAppStore((s) => s.updateBankAccount)
  const deleteBankAccount = useAppStore((s) => s.deleteBankAccount)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<BankAccount, 'id'>>(emptyForm)

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
  }

  const startEdit = (b: BankAccount) => {
    setEditingId(b.id)
    setForm({
      bankPresetId: b.bankPresetId,
      customBankName: b.customBankName,
      accountName: b.accountName,
      accountNumber: b.accountNumber,
      notes: b.notes,
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.accountName.trim() || !form.accountNumber.trim()) return
    if (form.bankPresetId === 'OTHER' && !form.customBankName.trim()) return

    if (editingId) {
      updateBankAccount(editingId, form)
    } else {
      addBankAccount(form)
    }
    resetForm()
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-950">Bank details</h2>
        <p className="text-sm text-ink-600 mt-1">
          Where clients should send payments. These appear on quotations and invoices. Stored only on this
          device.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm space-y-4"
      >
        <h3 className="font-display text-lg font-semibold text-ink-950">
          {editingId ? 'Edit account' : 'Add account'}
        </h3>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-600">Bank</span>
          <select
            className="rounded-md border border-ink-200 px-3 py-2 text-sm"
            value={form.bankPresetId}
            onChange={(e) =>
              setForm((f) => ({ ...f, bankPresetId: e.target.value }))
            }
          >
            {PRESET_PH_BANKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>

        {form.bankPresetId === 'OTHER' ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Bank name *</span>
            <input
              required
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={form.customBankName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customBankName: e.target.value }))
              }
              placeholder="e.g. Robinsons Bank"
            />
          </label>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-ink-600">Account name *</span>
            <input
              required
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={form.accountName}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountName: e.target.value }))
              }
              placeholder="Name as shown on the passbook / statement"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-ink-600">Account number *</span>
            <input
              required
              className="rounded-md border border-ink-200 px-3 py-2 text-sm font-mono tabular-nums"
              value={form.accountNumber}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  accountNumber: e.target.value.replace(/\s/g, ''),
                }))
              }
              placeholder="Digits only"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-ink-600">Notes (optional)</span>
            <input
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Savings · Branch Ortigas"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg px-4 py-2 text-sm text-ink-600 hover:bg-ink-50"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            {editingId ? 'Save changes' : 'Add bank account'}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-100 flex justify-between items-center">
          <h3 className="font-display text-lg font-semibold text-ink-950">Saved accounts</h3>
          <span className="text-xs text-ink-500">{bankAccounts.length} account(s)</span>
        </div>
        <ul className="divide-y divide-ink-100">
          {bankAccounts.length === 0 ? (
            <li className="px-4 py-8 text-sm text-ink-500 text-center">
              No bank accounts yet. Add one above — BPI and RCBC are in the list, plus other major PH banks
              or “Other”.
            </li>
          ) : (
            bankAccounts.map((b) => (
              <li
                key={b.id}
                className="px-4 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-ink-900">
                    {labelForPreset(b.bankPresetId, b.customBankName)}
                  </p>
                  <p className="text-sm text-ink-700 mt-1">{b.accountName}</p>
                  <p className="text-sm font-mono tabular-nums text-ink-800 mt-1">
                    {b.accountNumber}
                  </p>
                  {b.notes.trim() ? (
                    <p className="text-xs text-ink-500 mt-1">{b.notes}</p>
                  ) : null}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Remove this bank account?')) deleteBankAccount(b.id)
                    }}
                    className="text-sm text-ink-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
