import { useEffect, useState } from 'react'
import { listAppointmentsInRange, markReminderSent } from '../../lib/api'
import { formatDateLabel, formatTimeLabel } from '../../lib/format'
import { buildWhatsAppLink, reminderMessage } from '../../lib/whatsapp'
import { SALON_NAME } from '../../lib/supabase'
import Spinner from '../../components/Spinner'

function startOfDay(offsetDays = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return d
}

export default function Reminders() {
  const [appointments, setAppointments] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      const from = startOfDay(0).toISOString()
      const to = startOfDay(2).toISOString()
      const data = await listAppointmentsInRange(from, to)
      setAppointments(data.filter((a) => a.status === 'confirmed'))
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleMarkSent(id) {
    await markReminderSent(id)
    load()
  }

  if (!appointments) return <Spinner />

  const tomorrowStart = startOfDay(1)
  const today = appointments.filter((a) => new Date(a.starts_at) < tomorrowStart)
  const tomorrow = appointments.filter((a) => new Date(a.starts_at) >= tomorrowStart)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-700">Recordatorios por WhatsApp</h1>
        <p className="text-sm text-brand-400">
          Tocá "Enviar WhatsApp" para abrir un mensaje ya redactado y mandarlo con un toque. No se envía nada
          automático: vos confirmás cada envío.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ReminderGroup title="Hoy" items={today} onMarkSent={handleMarkSent} />
      <ReminderGroup title="Mañana" items={tomorrow} onMarkSent={handleMarkSent} />
    </div>
  )
}

function ReminderGroup({ title, items, onMarkSent }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-400">{title}</h2>
      {items.length === 0 && <p className="text-sm text-brand-400">Sin citas.</p>}
      <div className="space-y-2">
        {items.map((a) => {
          const clientName = a.profiles?.full_name || a.guest_name || 'Clienta'
          const clientPhone = a.profiles?.phone || a.guest_phone
          const message = reminderMessage({
            clientName,
            serviceName: a.services?.name,
            dateLabel: formatDateLabel(a.starts_at),
            timeLabel: formatTimeLabel(a.starts_at),
            salonName: SALON_NAME,
          })
          return (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-white p-3">
              <div>
                <p className="font-medium text-brand-800">
                  {formatTimeLabel(a.starts_at)} · {clientName}
                </p>
                <p className="text-sm text-brand-500">{a.services?.name}</p>
                {a.reminder_sent_at && <p className="text-xs text-green-600">✓ Recordatorio enviado</p>}
              </div>
              <div className="flex gap-1.5">
                {clientPhone ? (
                  <a
                    href={buildWhatsAppLink(clientPhone, message)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onMarkSent(a.id)}
                    className="rounded-full bg-green-500 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Enviar WhatsApp
                  </a>
                ) : (
                  <span className="text-xs text-brand-300">Sin teléfono</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
