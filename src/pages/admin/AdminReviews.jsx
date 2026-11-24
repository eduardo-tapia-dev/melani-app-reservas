import { useEffect, useState } from 'react'
import { listReviews } from '../../lib/api'
import StarRating from '../../components/StarRating'
import Spinner from '../../components/Spinner'
import { formatDateLabel } from '../../lib/format'

export default function AdminReviews() {
  const [reviews, setReviews] = useState(null)

  useEffect(() => {
    listReviews().then(setReviews)
  }, [])

  if (!reviews) return <Spinner />

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-700">Reseñas</h1>
        {avg && (
          <div className="flex items-center gap-2 text-sm text-brand-600">
            <StarRating value={Math.round(avg)} readOnly size="text-lg" />
            <span>
              {avg} promedio · {reviews.length} reseñas
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 && <p className="text-sm text-brand-400">Todavía no hay reseñas.</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-brand-100 bg-white p-3">
            <div className="flex items-start gap-3">
              {r.photo_url && (
                <img src={r.photo_url} alt="Trabajo realizado" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              )}
              <div>
                <StarRating value={r.rating} readOnly size="text-sm" />
                <p className="text-sm font-medium text-brand-800">{r.profiles?.full_name || 'Clienta'}</p>
                <p className="text-xs text-brand-300">{formatDateLabel(r.created_at)}</p>
                {r.comment && <p className="mt-1 text-sm text-brand-600">"{r.comment}"</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
