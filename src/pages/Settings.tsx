import { useState, type ChangeEventHandler } from 'react'
import { buildBackupPayload, downloadBackupJson, parseBackupPayload } from '../lib/backup'
import { downloadCsv, invoicesToCsv, quotesToCsv } from '../lib/csv'
import { fullBackupToCsv, parseFullBackupCsv } from '../lib/fullBackupCsv'
import { useAppStore } from '../store/useAppStore'

export function Settings() {
  const profile = useAppStore((s) => s.profile)
  const settings = useAppStore((s) => s.settings)
  const setProfile = useAppStore((s) => s.setProfile)
  const setSettings = useAppStore((s) => s.setSettings)
  const importFullState = useAppStore((s) => s.importFullState)

  const [migrationMsg, setMigrationMsg] = useState<string | null>(null)
  const [migrationErr, setMigrationErr] = useState<string | null>(null)

  const exportFullBackup = () => {
    setMigrationErr(null)
    const s = useAppStore.getState()
    const payload = buildBackupPayload({
      profile: s.profile,
      settings: s.settings,
      clients: s.clients,
      quotes: s.quotes,
      invoices: s.invoices,
      bankAccounts: s.bankAccounts,
    })
    downloadBackupJson(payload)
    setMigrationMsg('Full backup downloaded (.json). Use Import on another browser to restore.')
  }

  const exportFullBackupCsv = () => {
    setMigrationErr(null)
    const s = useAppStore.getState()
    const payload = buildBackupPayload({
      profile: s.profile,
      settings: s.settings,
      clients: s.clients,
      quotes: s.quotes,
      invoices: s.invoices,
      bankAccounts: s.bankAccounts,
    })
    downloadCsv(
      `quotation-app-backup-${new Date().toISOString().slice(0, 10)}.csv`,
      fullBackupToCsv(payload),
    )
    setMigrationMsg('Full backup downloaded (.csv). Use Import on another browser to restore.')
  }

  const exportQuotesCsv = () => {
    setMigrationErr(null)
    const s = useAppStore.getState()
    downloadCsv(
      `quotes-${new Date().toISOString().slice(0, 10)}.csv`,
      quotesToCsv(s.quotes, s.clients),
    )
    setMigrationMsg('Quotes CSV downloaded (spreadsheet-friendly; not a full restore).')
  }

  const exportInvoicesCsv = () => {
    setMigrationErr(null)
    const s = useAppStore.getState()
    downloadCsv(
      `invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      invoicesToCsv(s.invoices, s.clients),
    )
    setMigrationMsg('Invoices CSV downloaded (spreadsheet-friendly; not a full restore).')
  }

  const onImportFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    setMigrationMsg(null)
    setMigrationErr(null)
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const text = String(reader.result ?? '')
        const isCsv = file.name.toLowerCase().endsWith('.csv')
        const raw: unknown = isCsv ? (() => {
          const p = parseFullBackupCsv(text)
          if (!p.ok) throw new Error(p.error)
          return p.payload
        })() : JSON.parse(text)

        const parsed = parseBackupPayload(raw)
        if (!parsed.ok) {
          setMigrationErr(parsed.error)
          return
        }
        const ok = window.confirm(
          'Replace all data in this browser with the backup? This cannot be undone.',
        )
        if (!ok) return
        await importFullState(parsed.data)
        setMigrationMsg('Backup restored and synced to Supabase.')
      } catch {
        setMigrationErr('Could not read this file. Use a .json or full-backup .csv exported from this app.')
      } finally {
        e.target.value = ''
      }
    }
    reader.onerror = () => {
      setMigrationErr('Failed to read file.')
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-950">Settings</h2>
        <p className="text-sm text-ink-600 mt-1">
          Your name and defaults apply to every new quotation and invoice. Changes save automatically in this
          browser.
        </p>
      </div>

      <section className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-semibold text-ink-950">Your profile</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-ink-600">Name as shown on documents *</span>
            <input
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={profile.contractorName}
              onChange={(e) => setProfile({ contractorName: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-ink-600">Business / trading name (optional)</span>
            <input
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={profile.businessName}
              onChange={(e) => setProfile({ businessName: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Email</span>
            <input
              type="email"
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={profile.email}
              onChange={(e) => setProfile({ email: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Phone</span>
            <input
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={profile.phone}
              onChange={(e) => setProfile({ phone: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-ink-600">Address</span>
            <textarea
              rows={3}
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={profile.address}
              onChange={(e) => setProfile({ address: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2 rounded-lg bg-ink-50 border border-ink-100 p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={profile.showTin}
                onChange={(e) => setProfile({ showTin: e.target.checked })}
              />
              <span>Show TIN on documents (when registered)</span>
            </label>
            {profile.showTin ? (
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-600">TIN</span>
                <input
                  className="rounded-md border border-ink-200 px-3 py-2 text-sm max-w-xs"
                  value={profile.tin}
                  onChange={(e) => setProfile({ tin: e.target.value })}
                />
              </label>
            ) : (
              <p className="text-xs text-ink-500">
                As an individual contractor you can leave TIN hidden until you register.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-semibold text-ink-950">Numbering & defaults</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Quote prefix</span>
            <input
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={settings.quotePrefix}
              onChange={(e) => setSettings({ quotePrefix: e.target.value || 'Q' })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Next quote sequence #</span>
            <input
              type="number"
              min={1}
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={settings.nextQuoteNumber}
              onChange={(e) =>
                setSettings({ nextQuoteNumber: Number.parseInt(e.target.value, 10) || 1 })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Invoice prefix</span>
            <input
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={settings.invoicePrefix}
              onChange={(e) => setSettings({ invoicePrefix: e.target.value || 'INV' })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Next invoice sequence #</span>
            <input
              type="number"
              min={1}
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={settings.nextInvoiceNumber}
              onChange={(e) =>
                setSettings({ nextInvoiceNumber: Number.parseInt(e.target.value, 10) || 1 })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Default quotation validity (days)</span>
            <input
              type="number"
              min={1}
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={settings.defaultValidityDays}
              onChange={(e) =>
                setSettings({ defaultValidityDays: Number.parseInt(e.target.value, 10) || 30 })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-600">Default invoice due (days from issue)</span>
            <input
              type="number"
              min={1}
              className="rounded-md border border-ink-200 px-3 py-2 text-sm"
              value={settings.defaultInvoiceDueDays ?? 30}
              onChange={(e) =>
                setSettings({ defaultInvoiceDueDays: Number.parseInt(e.target.value, 10) || 30 })
              }
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-600">Default scope of work template</span>
          <textarea
            rows={4}
            className="rounded-md border border-ink-200 px-3 py-2 text-sm"
            value={settings.defaultScope}
            onChange={(e) => setSettings({ defaultScope: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-600">Default terms & conditions</span>
          <textarea
            rows={10}
            className="rounded-md border border-ink-200 px-3 py-2 text-xs leading-relaxed"
            value={settings.defaultTerms}
            onChange={(e) => setSettings({ defaultTerms: e.target.value })}
          />
        </label>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-semibold text-ink-950">Backup & migration</h3>
        <p className="text-sm text-ink-600">
          Move your data to another browser or machine: download a <strong>full backup</strong>, then import
          it where you need it. You can use <strong>.json</strong> or a <strong>full-backup .csv</strong>.
          (The full-backup CSV preserves nested data by storing the backup payload inside one CSV field.)
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportFullBackup}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Download full backup (.json)
          </button>
          <button
            type="button"
            onClick={exportFullBackupCsv}
            className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            Download full backup (.csv)
          </button>
          <button
            type="button"
            onClick={exportQuotesCsv}
            className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            Export quotes CSV
          </button>
          <button
            type="button"
            onClick={exportInvoicesCsv}
            className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            Export invoices CSV
          </button>
        </div>
        <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50/50 px-4 py-3">
          <p className="text-sm font-medium text-ink-800">Import backup into this browser</p>
          <p className="text-xs text-ink-500 mt-1 mb-2">
            Choose a <code className="text-[11px] bg-white px-1 rounded">.json</code> or full-backup{' '}
            <code className="text-[11px] bg-white px-1 rounded">.csv</code> you exported here before.
          </p>
          <input
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="text-sm text-ink-700 file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            onChange={onImportFile}
          />
        </div>
        {migrationMsg ? (
          <p className="text-sm text-emerald-700">{migrationMsg}</p>
        ) : null}
        {migrationErr ? <p className="text-sm text-red-600">{migrationErr}</p> : null}
      </section>
    </div>
  )
}
