export function buildWhatsAppLink(phone, message) {
  const digits = (phone ?? '').replace(/\D/g, '')
  const text = encodeURIComponent(message)
  return `https://wa.me/${digits}?text=${text}`
}

export function reminderMessage({ clientName, serviceName, dateLabel, timeLabel, salonName }) {
  const name = clientName ? clientName.split(' ')[0] : 'Hola'
  return (
    `¡Hola ${name}! 💖 Te escribo de ${salonName} para recordarte tu cita de ` +
    `${serviceName} el ${dateLabel} a las ${timeLabel}. ` +
    `Si necesitás reagendar o cancelar avisame por acá. ¡Te espero!`
  )
}
