import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listActiveServices, listReviews } from '../../lib/api'
import { formatGs, CATEGORY_LABELS } from '../../lib/format'
import StarRating from '../../components/StarRating'
import Spinner from '../../components/Spinner'

export default function Home() {
  const [services, setServices] = useState(null)
  const [reviews, setReviews] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listActiveServices().then(setServices).catch((e) => setError(e.message))
    listReviews().then(setReviews).catch(() => setReviews([]))
  }, [])

  const avgRating = reviews?.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const grouped = (services ?? []).reduce((acc, s) => {
    acc[s.category] = acc[s.category] ?? []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-semibold">Belleza que resalta tu mirada 💕</h1>
        <p className="mt-1 text-brand-100">Pestañas, cejas y micropigmentación con hora reservada, sin esperas.</p>
        {avgRating && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <StarRating value={Math.round(avgRating)} readOnly size="text-base" />
            <span>
              {avgRating} · {reviews.length} reseña{reviews.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
        <Link
          to="/reservar"
          className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-700 shadow"
        >
          Reservar una cita →
        </Link>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!services && !error && <Spinner label="Cargando servicios..." />}

      {services && (
        <section className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-400">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="space-y-2">
                {items.map((s) => (
                  <div key={s.id} className="rounded-xl border border-brand-100 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-brand-800">{s.name}</p>
                        {s.description && <p className="text-sm text-brand-400">{s.description}</p>}
                        <p className="mt-1 text-xs text-brand-300">{s.duration_minutes} min</p>
                      </div>
                      <p className="shrink-0 font-semibold text-brand-600">{formatGs(s.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-brand-400">Todavía no hay servicios cargados. ¡Vuelve pronto!</p>
          )}
        </section>
      )}

      {reviews && reviews.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-400">
            Lo que dicen nuestras clientas
          </h2>
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {reviews.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="w-64 shrink-0 snap-start rounded-xl border border-brand-100 bg-white p-3"
              >
                {r.photo_url && (
                  <img src={r.photo_url} alt="Trabajo realizado" className="mb-2 h-32 w-full rounded-lg object-cover" />
                )}
                <StarRating value={r.rating} readOnly size="text-sm" />
                {r.comment && <p className="mt-1 text-sm text-brand-700">"{r.comment}"</p>}
                <p className="mt-1 text-xs text-brand-300">{r.profiles?.full_name || 'Clienta'}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
