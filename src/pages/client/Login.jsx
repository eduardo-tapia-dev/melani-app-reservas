import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/mis-citas" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-brand-100 bg-white p-6 text-center">
        <p className="text-3xl">📩</p>
        <h1 className="mt-2 text-lg font-semibold text-brand-700">¡Revisa tu correo!</h1>
        <p className="mt-1 text-sm text-brand-500">
          Te enviamos un link de acceso a <strong>{email}</strong>. Abrilo desde este mismo celular para ingresar.
        </p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm font-medium text-brand-600 underline">
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-6 max-w-sm">
      <h1 className="text-xl font-semibold text-brand-700">Ingresá o creá tu cuenta</h1>
      <p className="mt-1 text-sm text-brand-400">
        No necesitás contraseña: te mandamos un link mágico a tu correo para entrar.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div>
          <label className="text-sm font-medium text-brand-600">Nombre completo</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            placeholder="Ej: Ana Gómez"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-600">WhatsApp</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            placeholder="Ej: 595981234567"
          />
          <p className="mt-1 text-xs text-brand-300">Con código de país, sin espacios ni el +.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-brand-600">Correo electrónico</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            placeholder="tu@correo.com"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-600 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Enviarme el link de acceso'}
        </button>
      </form>
    </div>
  )
}
