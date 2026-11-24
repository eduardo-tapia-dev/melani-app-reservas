import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { listMyAppointments, cancelAppointment, rescheduleAppointment, getAvailableSlots } from '../../lib/api'
import { formatDateLabel, formatTimeLabel, formatGs } from '../../lib/format'
import StarRating from '../../components/StarRating'
import Spinner from '../../components/Spinner'

const MIN_NOTICE_HOURS = 6

function canModify(startsAt) {
  return new Date(startsAt).getTime() - Date.now() > MIN_NOTICE_HOURS * 60 * 60 * 1000
}

export default function MisCitas() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState(null)
  const [error, setError] = useState('')
  const [reschedulingId, setReschedulingId] = useState(null)

  async function load() {
    try {
      const data = await listMyAppointments(user.id)
      setAppointments(data)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCancel(id) {
    if (!confirm('¿Seguro que querés cancelar esta cita?')) return
    try {
      await cancelAppointment(id)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  if (!appointments) return <Spinner />

  const now = Date.now()
  const upcoming = appointments.filter((a) => a.status === 'confirmed' && new Date(a.starts_at).getTime() >= now)
  const past = appointments.filter((a) => a.status !== 'confirmed' || new Date(a.starts_at).getTime() < now)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-brand-700">Mis citas</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-400">Próximas</h2>
        {upcoming.length === 0 && (
          <p className="text-sm text-brand-400">
            No tenés citas próximas.{' '}
            <Link to="/reservar" className="underline">
              Reservá una acá
            </Link>
            .
          </p>
        )}
        <div className="space-y-2">
          {upcoming.map((a) => (
            <div key={a.id} className="rounded-xl border border-brand-100 bg-white p-3">
              <p className="font-medium text-brand-800">{a.services?.name}</p>
              <p className="text-sm text-brand-500">
                {formatDateLabel(a.starts_at)} a las {formatTimeLabel(a.starts_at)} · {formatGs(a.services?.price)}
              </p>
              {a.notes && <p className="mt-1 text-xs text-brand-400">Nota: {a.notes}</p>}

              {canModify(a.starts_at) ? (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setReschedulingId(reschedulingId === a.id ? null : a.id)}
                    className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-600"
                  >
                    Reagendar
                  </button>
                  <button
                    onClick={() => handleCancel(a.id)}
                    className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-brand-300">
                  Para cambios con menos de {MIN_NOTICE_HOURS}hs de anticipación, escribí directo por WhatsApp.
                </p>
              )}

              {reschedulingId === a.id && (
                <RescheduleForm appointment={a} onDone={() => { setReschedulingId(null); load() }} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-400">Historial</h2>
        {past.length === 0 && <p className="text-sm text-brand-400">Todavía no tenés citas pasadas.</p>}
        <div className="space-y-2">
          {past.map((a) => {
            const isPastConfirmed = a.status === 'confirmed' && new Date(a.starts_at).getTime() < now
            const review = a.reviews?.[0]
            return (
              <div key={a.id} className="rounded-xl border border-brand-100 bg-white p-3 opacity-90">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-brand-800">{a.services?.name}</p>
                  {a.status === 'cancelled' && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-500">Cancelada</span>
                  )}
                </div>
                <p className="text-sm text-brand-500">
                  {formatDateLabel(a.starts_at)} a las {formatTimeLabel(a.starts_at)}
                </p>

                {isPastConfirmed && (
                  review ? (
                    <div className="mt-1">
                      <StarRating value={review.rating} readOnly size="text-sm" />
                    </div>
                  ) : (
                    <Link
                      to={`/mis-citas/${a.id}/resena`}
                      className="mt-2 inline-block rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Dejar reseña ⭐
                    </Link>
                  )
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function RescheduleForm({ appointment, onDone }) {
  const [date, setDate] = useState(appointment.starts_at.slice(0, 10))
  const [slots, setSlots] = useState(null)
  const [slotStart, setSlotStart] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setSlots(null)
    getAvailableSlots(date, appointment.service_id).then(setSlots).catch((e) => setError(e.message))
  }, [date, appointment.service_id])

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      await rescheduleAppointment(appointment.id, slotStart)
      onDone()
    } catch (e) {
      setError(e.message?.includes('exclude') ? 'Ese horario ya no está disponible.' : e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg bg-brand-50 p-2">
      <input
        type="date"
        value={date}
        min={new Date().toISOString().slice(0, 10)}
        onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-lg border border-brand-200 px-2 py-1.5 text-sm"
      />
      {slots === null && <p className="mt-2 text-xs text-brand-400">Buscando horarios...</p>}
      {slots && slots.length === 0 && <p className="mt-2 text-xs text-brand-400">Sin horarios ese día.</p>}
      {slots && slots.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {slots.map((s) => (
            <button
              key={s}
              onClick={() => setSlotStart(s)}
              className={`rounded-lg border px-1.5 py-1 text-xs ${
                slotStart === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 bg-white'
              }`}
            >
              {formatTimeLabel(s)}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <button
        disabled={!slotStart || submitting}
        onClick={submit}
        className="mt-2 w-full rounded-full bg-brand-600 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {submitting ? 'Guardando...' : 'Confirmar nuevo horario'}
      </button>
    </div>
  )
}
