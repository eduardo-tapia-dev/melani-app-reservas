import { useEffect, useState } from 'react'
import { listAllServices, createService, updateService, deleteService } from '../../lib/api'
import { formatGs, CATEGORY_LABELS } from '../../lib/format'
import Spinner from '../../components/Spinner'

const emptyForm = { name: '', category: 'pestanas', description: '', duration_minutes: 60, price: 0 }

export default function Services() {
  const [services, setServices] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setServices(await listAllServices())
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(s) {
    setEditingId(s.id)
    setForm({
      name: s.name,
      category: s.category,
      description: s.description ?? '',
      duration_minutes: s.duration_minutes,
      price: s.price,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload = { ...form, duration_minutes: Number(form.duration_minutes), price: Number(form.price) }
      if (editingId) {
        await updateService(editingId, payload)
      } else {
        await createService({ ...payload, active: true })
      }
      resetForm()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(s) {
    if (s.active) {
      await deleteService(s.id) // baja lógica
    } else {
      await updateService(s.id, { active: true })
    }
    load()
  }

  if (!services) return <Spinner />

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h1 className="mb-3 text-xl font-semibold text-brand-700">Servicios</h1>
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className={`rounded-xl border bg-white p-3 ${s.active ? 'border-brand-200' : 'border-brand-100 opacity-50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-brand-800">{s.name}</p>
                  <p className="text-xs uppercase tracking-wide text-brand-300">{CATEGORY_LABELS[s.category] ?? s.category}</p>
                  <p className="text-sm text-brand-500">
                    {formatGs(s.price)} · {s.duration_minutes} min
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button onClick={() => startEdit(s)} className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-600">
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(s)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      s.active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {s.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-brand-700">{editingId ? 'Editar servicio' : 'Nuevo servicio'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-brand-200 bg-white p-4">
          <div>
            <label className="text-sm font-medium text-brand-600">Nombre</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-600">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-brand-600">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-brand-600">Duración (min)</label>
              <input
                required
                type="number"
                min={5}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-600">Precio (Gs)</label>
              <input
                required
                type="number"
                min={0}
                step={1000}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-full bg-brand-600 py-2 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear servicio'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-full bg-brand-100 px-4 py-2 text-brand-600">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
