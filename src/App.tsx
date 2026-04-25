import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Clients } from './pages/Clients'
import { Quotes } from './pages/Quotes'
import { QuoteEditor } from './pages/QuoteEditor'
import { Invoices } from './pages/Invoices'
import { InvoiceEditor } from './pages/InvoiceEditor'
import { Settings } from './pages/Settings'
import { BankDetails } from './pages/BankDetails'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/:id" element={<QuoteEditor />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceEditor />} />
            <Route path="settings" element={<Settings />} />
            <Route path="bank-details" element={<BankDetails />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
