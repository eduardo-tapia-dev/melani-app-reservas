export function formatGs(amount) {
  return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(
    amount
  )
}

export function formatDateLabel(date) {
  return new Intl.DateTimeFormat('es-PY', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(date))
}

export function formatTimeLabel(date) {
  return new Intl.DateTimeFormat('es-PY', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(date)
  )
}

export function formatDateTimeShort(date) {
  return `${formatDateLabel(date)} · ${formatTimeLabel(date)}`
}

export const CATEGORY_LABELS = {
  pestanas: 'Pestañas',
  cejas: 'Cejas',
  micropigmentacion: 'Micropigmentación',
  general: 'Otros servicios',
}
