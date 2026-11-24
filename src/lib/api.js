import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------
export async function listActiveServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('category')
    .order('name')
  if (error) throw error
  return data
}

export async function listAllServices() {
  const { data, error } = await supabase.from('services').select('*').order('category').order('name')
  if (error) throw error
  return data
}

export async function createService(payload) {
  const { data, error } = await supabase.from('services').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateService(id, payload) {
  const { data, error } = await supabase.from('services').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteService(id) {
  // Baja lógica: si tiene citas asociadas no se puede borrar por la FK, así que desactivamos.
  const { error } = await supabase.from('services').update({ active: false }).eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Horarios disponibles
// ---------------------------------------------------------------------------
export async function getAvailableSlots(dateISO, serviceId) {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_date: dateISO,
    p_service_id: serviceId,
  })
  if (error) throw error
  return (data ?? []).map((row) => row.slot_start)
}

// ---------------------------------------------------------------------------
// Citas — clientas
// ---------------------------------------------------------------------------
export async function createAppointment({ serviceId, startsAt, notes, clientId }) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({ service_id: serviceId, starts_at: startsAt, notes: notes ?? '', client_id: clientId })
    .select('*, services(*)')
    .single()
  if (error) throw error
  return data
}

export async function listMyAppointments(clientId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, services(*), reviews(id, rating)')
    .eq('client_id', clientId)
    .order('starts_at', { ascending: false })
  if (error) throw error
  return data
}

export async function cancelAppointment(id) {
  const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}

export async function rescheduleAppointment(id, newStartsAt) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ starts_at: newStartsAt })
    .eq('id', id)
    .select('*, services(*)')
    .single()
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Citas — admin
// ---------------------------------------------------------------------------
export async function listAppointmentsInRange(fromISO, toISO) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, services(*), profiles(full_name, phone)')
    .gte('starts_at', fromISO)
    .lt('starts_at', toISO)
    .order('starts_at')
  if (error) throw error
  return data
}

export async function createAppointmentAdmin({ serviceId, startsAt, notes, clientId, guestName, guestPhone }) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      service_id: serviceId,
      starts_at: startsAt,
      notes: notes ?? '',
      client_id: clientId ?? null,
      guest_name: clientId ? null : guestName,
      guest_phone: clientId ? null : guestPhone,
    })
    .select('*, services(*), profiles(full_name, phone)')
    .single()
  if (error) throw error
  return data
}

export async function updateAppointmentAdmin(id, payload) {
  const { data, error } = await supabase
    .from('appointments')
    .update(payload)
    .eq('id', id)
    .select('*, services(*), profiles(full_name, phone)')
    .single()
  if (error) throw error
  return data
}

export async function deleteAppointmentAdmin(id) {
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
}

export async function markReminderSent(id) {
  const { error } = await supabase
    .from('appointments')
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function searchClients(query) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('role', 'client')
    .ilike('full_name', `%${query}%`)
    .limit(10)
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Reseñas
// ---------------------------------------------------------------------------
export async function listReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createReview({ appointmentId, clientId, rating, comment, photoFile }) {
  let photo_url = null
  if (photoFile) {
    const ext = photoFile.name.split('.').pop()
    const path = `${clientId}/${appointmentId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('review-photos').upload(path, photoFile)
    if (uploadError) throw uploadError
    const { data: publicUrl } = supabase.storage.from('review-photos').getPublicUrl(path)
    photo_url = publicUrl.publicUrl
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({ appointment_id: appointmentId, client_id: clientId, rating, comment, photo_url })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------
export async function updateMyProfile(id, payload) {
  const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
