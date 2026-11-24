import { useEffect, useState } from 'react'
import { listAppointmentsInRange, cancelAppointment, deleteAppointmentAdmin } from '../../lib/api'
import { formatGs, formatTimeLabel } from '../../lib/format'
import { buildWhatsAppLink } from '../../lib/whatsapp'
import Spinner from '../../components/Spinner'
import AppointmentForm from './AppointmentForm'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateISO, days) {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function dayBounds(dateISO) {
  const start = new Date(`${dateISO}T00:00:00`)
  const end = new Date(`${dateISO}T00:00:00`)
  end.setDate(end.getDate() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

export default function Calendar() {
  const [date, setDate] = useState(todayISO())
  const [appointments, setAppointments] = useState(null)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    setError('')
    try {
      const { from, to } = dayBounds(date)
      const data = await listAppointmentsInRange(from, to)
      setAppointments(data)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    setAppointments(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  async function handleCancel(id) {
    if (!confirm('¿Cancelar esta cita?')) return
    await cancelAppointment(id)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Esto borra la cita permanentemente. ¿Continuar?')) return
    await deleteAppointmentAdmin(id)
    load()
  }

  const dateLabel = new Intl.DateTimeFormat('es-PY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T00:00:00`))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-700">Calendario</h1>
          <p className="text-sm capitalize text-brand-400">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(addDays(date, -1))} className="rounded-full bg-brand-100 px-3 py-1.5 text-brand-600">
            ← Anterior
          </button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-brand-200 px-2 py-1.5" />
          <button onClick={() => setDate(addDays(date, 1))} className="rounded-full bg-brand-100 px-3 py-1.5 text-brand-600">
            Siguiente →
          </button>
          <button onClick={() => setDate(todayISO())} className="rounded-full bg-brand-500 px-3 py-1.5 text-white">
            Hoy
          </button>
        </div>
      </div>

      <button
        onClick={() => {
          setEditing(null)
          setShowForm((v) => !v)
        }}
        className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {showForm && !editing ? 'Cerrar formulario' : '+ Nueva cita'}
      </button>

      {showForm && (
        <AppointmentForm
          initialDate={date}
          appointment={editing}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSaved={() => {
            setShowForm(false)
            setEditing(null)
            load()
          }}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!appointments && <Spinner />}

      {appointments && appointments.length === 0 && (
        <p className="rounded-xl border border-dashed border-brand-200 p-6 text-center text-sm text-brand-400">
          No hay citas agendadas para este día.
        </p>
      )}

      <div className="space-y-2">
        {appointments?.map((a) => {
          const clientName = a.profiles?.full_name || a.guest_name || 'Clienta'
          const clientPhone = a.profiles?.phone || a.guest_phone
          return (
            <div
              key={a.id}
              className={`rounded-xl border bg-white p-3 ${
                a.status === 'cancelled' ? 'border-brand-100 opacity-50' : 'border-brand-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-brand-800">
                    {formatTimeLabel(a.starts_at)} – {formatTimeLabel(a.ends_at)} · {clientName}
                  </p>
                  <p className="text-sm text-brand-500">
                    {a.services?.name} · {formatGs(a.services?.price)}
                  </p>
                  {a.notes && <p className="text-xs text-brand-400">Nota: {a.notes}</p>}
                  {a.status === 'cancelled' && <p className="text-xs font-medium text-red-500">Cancelada</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {clientPhone && (
                    <a
                      href={buildWhatsAppLink(clientPhone, `¡Hola ${clientName.split(' ')[0]}!`)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                    >
                      WhatsApp
                    </a>
                  )}
                  {a.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => {
                          setEditing(a)
                          setShowForm(true)
                        }}
                        className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleCancel(a.id)}
                        className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
