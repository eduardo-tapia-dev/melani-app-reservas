import { useEffect, useState } from 'react'
import { listActiveServices, searchClients, createAppointmentAdmin, updateAppointmentAdmin } from '../../lib/api'
import { formatGs } from '../../lib/format'

function toLocalInputValue(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AppointmentForm({ initialDate, appointment, onSaved, onCancel }) {
  const isEdit = Boolean(appointment)
  const [services, setServices] = useState([])
  const [serviceId, setServiceId] = useState(appointment?.service_id ?? '')
  const [startsAt, setStartsAt] = useState(
    appointment ? toLocalInputValue(appointment.starts_at) : `${initialDate}T09:00`
  )
  const [notes, setNotes] = useState(appointment?.notes ?? '')

  const [mode, setMode] = useState(appointment?.client_id ? 'registered' : 'guest')
  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState([])
  const [selectedClient, setSelectedClient] = useState(
    appointment?.client_id ? { id: appointment.client_id, full_name: appointment.profiles?.full_name } : null
  )
  const [guestName, setGuestName] = useState(appointment?.guest_name ?? '')
  const [guestPhone, setGuestPhone] = useState(appointment?.guest_phone ?? '')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listActiveServices().then((data) => {
      setServices(data)
      if (!serviceId && data.length) setServiceId(data[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mode !== 'registered' || clientQuery.trim().length < 2) {
      setClientResults([])
      return
    }
    const t = setTimeout(() => {
      searchClients(clientQuery.trim()).then(setClientResults).catch(() => setClientResults([]))
    }, 250)
    return () => clearTimeout(t)
  }, [clientQuery, mode])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'registered' && !selectedClient) {
      setError('Elegí una clienta de la lista o pasate a "clienta sin cuenta".')
      return
    }
    if (mode === 'guest' && !guestName.trim()) {
      setError('Ingresá el nombre de la clienta.')
      return
    }
    setSubmitting(true)
    try {
      const isoStart = new Date(startsAt).toISOString()
      if (isEdit) {
        await updateAppointmentAdmin(appointment.id, {
          service_id: serviceId,
          starts_at: isoStart,
          notes,
          client_id: mode === 'registered' ? selectedClient.id : null,
          guest_name: mode === 'guest' ? guestName.trim() : null,
          guest_phone: mode === 'guest' ? guestPhone.trim() : null,
        })
      } else {
        await createAppointmentAdmin({
          serviceId,
          startsAt: isoStart,
          notes,
          clientId: mode === 'registered' ? selectedClient.id : null,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
        })
      }
      onSaved()
    } catch (err) {
      setError(
        err.message?.includes('exclude') || err.code === '23P01'
          ? 'Ese horario ya está ocupado por otra cita. Elegí otro horario.'
          : err.message
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-brand-200 bg-white p-4">
      <h3 className="font-semibold text-brand-700">{isEdit ? 'Editar cita' : 'Nueva cita'}</h3>

      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode('registered')}
          className={`rounded-full px-3 py-1 ${mode === 'registered' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600'}`}
        >
          Clienta registrada
        </button>
        <button
          type="button"
          onClick={() => setMode('guest')}
          className={`rounded-full px-3 py-1 ${mode === 'guest' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600'}`}
        >
          Reserva por teléfono
        </button>
      </div>

      {mode === 'registered' ? (
        <div>
          <label className="text-sm font-medium text-brand-600">Buscar clienta</label>
          <input
            value={selectedClient ? selectedClient.full_name : clientQuery}
            onChange={(e) => {
              setSelectedClient(null)
              setClientQuery(e.target.value)
            }}
            placeholder="Nombre de la clienta..."
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
          />
          {clientResults.length > 0 && !selectedClient && (
            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-brand-100">
              {clientResults.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    setSelectedClient(c)
                    setClientQuery('')
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                >
                  {c.full_name} {c.phone && <span className="text-brand-300">· {c.phone}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium text-brand-600">Nombre</label>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-600">WhatsApp</label>
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="595981234567"
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-brand-600">Servicio</label>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {formatGs(s.price)} ({s.duration_minutes} min)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-brand-600">Fecha y hora</label>
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-brand-600">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-full bg-brand-600 py-2 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cita'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full bg-brand-100 px-4 py-2 text-brand-600">
          Cancelar
        </button>
      </div>
    </form>
  )
}
