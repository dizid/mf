import { recommendationInfo } from '@/lib/scoring'
import type { Recommendation } from '@/lib/db/schema'

interface RecommendationBadgeProps {
  recommendation: Recommendation | string | null
  size?: 'small' | 'large'
}

export function RecommendationBadge({ recommendation, size = 'small' }: RecommendationBadgeProps) {
  if (!recommendation || !(recommendation in recommendationInfo)) {
    return null
  }

  const info = recommendationInfo[recommendation as Recommendation]

  if (size === 'large') {
    return (
      <div className={`${info.bgColor} rounded-xl p-4 text-center`}>
        <div className="text-4xl mb-2">{info.emoji}</div>
        <div className={`text-xl font-bold ${info.color}`}>{info.label}</div>
        <div className="text-sm text-gray-600 mt-1">{info.description}</div>
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${info.bgColor} ${info.color}`}>
      <span>{info.emoji}</span>
      <span>{info.label}</span>
    </span>
  )
}
