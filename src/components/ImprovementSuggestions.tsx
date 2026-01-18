import type { Evaluation } from '@/lib/db/schema'
import { metricDefinitions, type MetricKey } from '@/lib/scoring'

interface ImprovementSuggestionsProps {
  evaluation: Evaluation
  limit?: number
}

// Map database fields to metric keys
const fieldToKey: Record<string, MetricKey> = {
  scoreUsability: 'usability',
  scoreValue: 'value',
  scoreFeatures: 'features',
  scorePolish: 'polish',
  scoreCompetition: 'competition',
  scoreMarket: 'market',
  scoreMonetization: 'monetization',
  scoreMaintenance: 'maintenance',
  scoreGrowth: 'growth',
  scorePassion: 'passion',
  scoreLearning: 'learning',
  scorePride: 'pride',
}

// Weight by impact (product metrics weighted higher since 50% of overall)
const impactWeights: Record<MetricKey, number> = {
  usability: 1.0,
  value: 1.2, // Highest weight - value drives recommendation
  features: 0.9,
  polish: 0.8,
  competition: 0.9,
  market: 0.7,
  monetization: 0.8,
  maintenance: 0.6,
  growth: 0.7,
  passion: 0.5,
  learning: 0.4,
  pride: 0.4,
}

interface WeakMetric {
  key: MetricKey
  score: number
  label: string
  improvements: readonly string[]
  isInverted: boolean
}

function getWeakMetrics(evaluation: Evaluation, limit: number): WeakMetric[] {
  const weakMetrics: WeakMetric[] = []

  for (const [field, key] of Object.entries(fieldToKey)) {
    const score = evaluation[field as keyof Evaluation] as number | null
    if (score === null || score === undefined) continue

    const def = metricDefinitions[key]
    const isInverted = 'inverted' in def && def.inverted === true

    // For inverted metrics (maintenance), high score is bad
    // For normal metrics, low score is bad
    const isWeak = isInverted ? score >= 7 : score <= 4

    if (isWeak) {
      weakMetrics.push({
        key,
        score,
        label: def.label,
        improvements: def.improvements,
        isInverted,
      })
    }
  }

  // Sort by impact weight (descending) so most impactful improvements come first
  weakMetrics.sort((a, b) => impactWeights[b.key] - impactWeights[a.key])

  return weakMetrics.slice(0, limit)
}

export function ImprovementSuggestions({ evaluation, limit = 3 }: ImprovementSuggestionsProps) {
  const weakMetrics = getWeakMetrics(evaluation, limit)

  if (weakMetrics.length === 0) {
    return null
  }

  return (
    <div className="bg-yellow-50 rounded-xl p-4 mt-6 shadow-sm">
      <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Areas to Improve
      </h3>
      <div className="space-y-4">
        {weakMetrics.map((metric) => (
          <div key={metric.key} className="bg-white rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">{metric.label}</span>
              <span className={`text-sm font-semibold ${
                metric.isInverted ? 'text-danger' : 'text-danger'
              }`}>
                {metric.score}/10
                {metric.isInverted && <span className="text-xs text-gray-400 ml-1">(too high)</span>}
              </span>
            </div>
            <ul className="space-y-1">
              {metric.improvements.slice(0, 2).map((tip, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
