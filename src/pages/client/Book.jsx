import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { listActiveServices, getAvailableSlots, createAppointment } from '../../lib/api'
import { formatGs, formatDateLabel, formatTimeLabel, CATEGORY_LABELS } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function maxDateISO() {
  const d = new Date()
  d.setDate(d.getDate() + 45)
  return d.toISOString().slice(0, 10)
}

export default function Book() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [services, setServices] = useState(null)
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [slots, setSlots] = useState(null)
  const [slotStart, setSlotStart] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  useEffect(() => {
    listActiveServices().then((data) => {
      setServices(data)
      if (data.length) setServiceId(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!serviceId || !date) return
    setSlots(null)
    setSlotStart('')
    getAvailableSlots(date, serviceId)
      .then(setSlots)
      .catch((e) => setError(e.message))
  }, [serviceId, date])

  async function handleConfirm() {
    if (!user) {
      navigate('/ingresar')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const appt = await createAppointment({ serviceId, startsAt: slotStart, notes, clientId: user.id })
      setDone(appt)
    } catch (err) {
      setError(
        err.message?.includes('exclude')
          ? 'Ese horario se acaba de ocupar. Elegí otro, por favor.'
          : err.message
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-brand-100 bg-white p-6 text-center">
        <p className="text-3xl">🎉</p>
        <h1 className="mt-2 text-lg font-semibold text-brand-700">¡Cita confirmada!</h1>
        <p className="mt-1 text-sm text-brand-500">
          {done.services?.name} el {formatDateLabel(done.starts_at)} a las {formatTimeLabel(done.starts_at)}.
        </p>
        <Link to="/mis-citas" className="mt-4 inline-block text-sm font-medium text-brand-600 underline">
          Ver mis citas
        </Link>
      </div>
    )
  }

  const selectedService = services?.find((s) => s.id === serviceId)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-brand-700">Reservar una cita</h1>

      {!user && (
        <div className="rounded-lg bg-brand-100 p-3 text-sm text-brand-700">
          Podés elegir servicio y horario primero.{' '}
          <Link to="/ingresar" className="font-semibold underline">
            Iniciá sesión
          </Link>{' '}
          para confirmar la reserva.
        </div>
      )}

      {!services && <Spinner label="Cargando servicios..." />}

      {services && services.length === 0 && (
        <p className="text-sm text-brand-400">Todavía no hay servicios disponibles para reservar.</p>
      )}

      {services && services.length > 0 && (
        <>
          <div>
            <label className="text-sm font-medium text-brand-600">Servicio</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {CATEGORY_LABELS[s.category] ?? s.category} · {s.name} — {formatGs(s.price)} ({s.duration_minutes}{' '}
                  min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-brand-600">Fecha</label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              max={maxDateISO()}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-brand-600">Horarios disponibles</label>
            {slots === null && <Spinner label="Buscando horarios..." />}
            {slots && slots.length === 0 && (
              <p className="mt-2 text-sm text-brand-400">No hay horarios disponibles ese día. Probá otra fecha.</p>
            )}
            {slots && slots.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlotStart(s)}
                    className={`rounded-lg border px-2 py-1.5 text-sm ${
                      slotStart === s
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-brand-200 bg-white text-brand-700'
                    }`}
                  >
                    {formatTimeLabel(s)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {slotStart && (
            <div>
              <label className="text-sm font-medium text-brand-600">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
                placeholder="Alguna preferencia o comentario para Melani..."
              />
            </div>
          )}

          {slotStart && selectedService && (
            <div className="rounded-xl border border-brand-100 bg-white p-3 text-sm">
              <p className="font-medium text-brand-800">Resumen</p>
              <p className="text-brand-500">
                {selectedService.name} · {formatDateLabel(date)} a las {formatTimeLabel(slotStart)}
              </p>
              <p className="text-brand-500">{formatGs(selectedService.price)}</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={!slotStart || submitting}
            onClick={handleConfirm}
            className="w-full rounded-full bg-brand-600 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Confirmando...' : user ? 'Confirmar reserva' : 'Iniciar sesión y confirmar'}
          </button>
        </>
      )}
    </div>
  )
}
