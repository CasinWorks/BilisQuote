import { useState } from 'react'
import type { Client } from '../types'
import { useAppStore } from '../store/useAppStore'
import { formatDate } from '../lib/format'

export function Clients() {
  const clients = useAppStore((s) => s.clients)
  const addClient = useAppStore((s) => s.addClient)
  const updateClient = useAppStore((s) => s.updateClient)
  const deleteClient = useAppStore((s) => s.deleteClient)

  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    billingAddress: '',
    notes: '',
  })

  const resetForm = () => {
    setForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      billingAddress: '',
      notes: '',
    })
    setEditing(null)
  }

  const startEdit = (c: Client) => {
    setEditing(c)
    setForm({
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      billingAddress: c.billingAddress,
      notes: c.notes,
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editing) {
      updateClient(editing.id, { ...form })
    } else {
      addClient({ ...form })
    }
    resetForm()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-950">Clients</h2>
        <p className="text-sm text-ink-600 mt-1">
          Profiles are reused when you create quotations and invoices.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={submit}
          className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm space-y-4"
        >
          <h3 className="font-display text-lg font-semibold text-ink-950">
            {editing ? 'Edit client' : 'New client'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-600">Contact name *</span>
              <input
                required
                className="rounded-md border border-ink-200 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-600">Company</span>
              <input
                className="rounded-md border border-ink-200 px-3 py-2 text-sm"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-600">Email</span>
              <input
                type="email"
                className="rounded-md border border-ink-200 px-3 py-2 text-sm"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-600">Phone</span>
              <input
                className="rounded-md border border-ink-200 px-3 py-2 text-sm"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Billing address</span>
            <textarea
              rows={3}
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={form.billingAddress}
              onChange={(e) => setForm((f) => ({ ...f, billingAddress: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Internal notes</span>
            <textarea
              rows={2}
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2">
            {editing ? (
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
              {editing ? 'Save changes' : 'Save client'}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex justify-between items-center">
            <h3 className="font-display text-lg font-semibold text-ink-950">Directory</h3>
            <span className="text-xs text-ink-500">{clients.length} clients</span>
          </div>
          <ul className="divide-y divide-ink-100 max-h-[480px] overflow-y-auto">
            {clients.length === 0 ? (
              <li className="px-4 py-8 text-sm text-ink-500 text-center">
                No clients yet. Add your first contact.
              </li>
            ) : (
              clients.map((c) => (
                <li key={c.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink-900">{c.name}</p>
                    <p className="text-sm text-ink-600">
                      {c.company || '—'} · {c.email || 'no email'}
                    </p>
                    <p className="text-xs text-ink-400 mt-1">Added {formatDate(c.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this client?')) deleteClient(c.id)
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
    </div>
  )
}
