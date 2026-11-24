import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const { user, isAdmin, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && user && isAdmin) return <Navigate to="/admin/calendario" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/admin/calendario` },
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-6">
        <p className="text-2xl">🔐</p>
        <h1 className="mt-2 text-lg font-semibold text-brand-700">Panel de administración</h1>

        {sent ? (
          <p className="mt-3 text-sm text-brand-500">
            Te enviamos un link de acceso a <strong>{email}</strong>. Abrilo desde este celular.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-lg border border-brand-200 px-3 py-2"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-brand-600 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Enviarme el link de acceso'}
            </button>
          </form>
        )}

        {user && !isAdmin && !loading && (
          <p className="mt-3 text-sm text-red-600">
            Esta cuenta no tiene permisos de administradora todavía.
          </p>
        )}
      </div>
    </div>
  )
}
