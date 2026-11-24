export default function StarRating({ value = 0, onChange, size = 'text-2xl', readOnly = false }) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className={`flex gap-1 ${size}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`leading-none transition-transform ${
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${star <= value ? 'text-gold-500' : 'text-brand-200'}`}
          aria-label={`${star} estrellas`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
