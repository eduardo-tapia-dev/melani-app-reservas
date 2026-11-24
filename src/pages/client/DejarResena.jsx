import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createReview } from '../../lib/api'
import StarRating from '../../components/StarRating'

export default function DejarResena() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleFile(e) {
    const file = e.target.files?.[0]
    setPhotoFile(file ?? null)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createReview({ appointmentId: id, clientId: user.id, rating, comment, photoFile })
      navigate('/mis-citas')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-xl font-semibold text-brand-700">Contanos cómo te fue</h1>
      <p className="mt-1 text-sm text-brand-400">Tu opinión ayuda a otras clientas a elegir con confianza.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-brand-600">Calificación</label>
          <div className="mt-1">
            <StarRating value={rating} onChange={setRating} size="text-3xl" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-brand-600">Comentario</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            placeholder="¿Qué te pareció el resultado y la atención?"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-brand-600">Foto del resultado (opcional)</label>
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="mt-1 w-full text-sm" />
          {preview && <img src={preview} alt="Vista previa" className="mt-2 h-40 w-full rounded-lg object-cover" />}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-600 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Enviando...' : 'Enviar reseña'}
        </button>
      </form>
    </div>
  )
}
