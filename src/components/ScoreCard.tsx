interface ScoreCardProps {
  name: string
  score: number
  subtitle?: string
  showDetails?: boolean
}

export function ScoreCard({ name, score, subtitle, showDetails = false }: ScoreCardProps) {
  const scoreColor =
    score >= 90 ? 'text-success bg-green-50' :
    score >= 70 ? 'text-warning bg-yellow-50' :
    'text-danger bg-red-50'

  const scoreLabel =
    score >= 90 ? 'Excellent' :
    score >= 70 ? 'Good' :
    score >= 50 ? 'Needs Work' :
    'Poor'

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm min-h-row flex items-center gap-4 active:bg-gray-50">
      {/* Score Badge */}
      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${scoreColor}`}>
        <span className="text-xl font-bold">{score}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
        {subtitle && (
          <p className="text-label text-gray-500 truncate">{subtitle}</p>
        )}
        {showDetails && (
          <p className="text-label text-gray-400 mt-1">{scoreLabel}</p>
        )}
      </div>

      {/* Arrow */}
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}
