import { useAppStore } from '../store/useAppStore'

export function Settings() {
  const profile = useAppStore((s) => s.profile)
  const settings = useAppStore((s) => s.settings)
  const setProfile = useAppStore((s) => s.setProfile)
  const setSettings = useAppStore((s) => s.setSettings)


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
    </div>
  )
}
