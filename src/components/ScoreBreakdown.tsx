'use client'

import { useState } from 'react'
import type { Evaluation } from '@/lib/db/schema'
import { metricDefinitions } from '@/lib/scoring'

interface ScoreBreakdownProps {
  evaluation: Evaluation
}

const productMetrics = ['scoreUsability', 'scoreValue', 'scoreFeatures', 'scorePolish', 'scoreCompetition'] as const
const businessMetrics = ['scoreMarket', 'scoreMonetization', 'scoreMaintenance', 'scoreGrowth'] as const
const personalMetrics = ['scorePassion', 'scoreLearning', 'scorePride'] as const

// Map database fields to metric keys
const fieldToKey: Record<string, keyof typeof metricDefinitions> = {
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

export function ScoreBreakdown({ evaluation }: ScoreBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Composite Scores */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Composite Scores</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`text-2xl font-bold ${getScoreColor(Number(evaluation.productScore))}`}>
              {evaluation.productScore ? Number(evaluation.productScore).toFixed(1) : '-'}
            </div>
            <div className="text-label text-gray-500">Product</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${getScoreColor(Number(evaluation.businessScore))}`}>
              {evaluation.businessScore ? Number(evaluation.businessScore).toFixed(1) : '-'}
            </div>
            <div className="text-label text-gray-500">Business</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${getScoreColor(Number(evaluation.personalScore))}`}>
              {evaluation.personalScore ? Number(evaluation.personalScore).toFixed(1) : '-'}
            </div>
            <div className="text-label text-gray-500">Personal</div>
          </div>
        </div>
      </div>

      {/* Product Metrics */}
      <MetricSection
        title="Product Quality"
        metrics={productMetrics}
        evaluation={evaluation}
      />

      {/* Business Metrics */}
      <MetricSection
        title="Business Viability"
        metrics={businessMetrics}
        evaluation={evaluation}
      />

      {/* Personal Metrics */}
      <MetricSection
        title="Personal Investment"
        metrics={personalMetrics}
        evaluation={evaluation}
      />

    </div>
  )
}

function MetricSection({
  title,
  metrics,
  evaluation,
}: {
  title: string
  metrics: readonly string[]
  evaluation: Evaluation
}) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null)
  const notes = evaluation.notes as Record<string, string> | null

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {metrics.map((field) => {
          const key = fieldToKey[field]
          const def = metricDefinitions[key]
          const score = evaluation[field as keyof Evaluation] as number | null
          const note = notes?.[key]
          const hasNote = !!note
          const isExpanded = expandedMetric === field

          if (score === null || score === undefined) return null

          const isInverted = key === 'maintenance'

          return (
            <div key={field}>
              <button
                type="button"
                onClick={() => hasNote && setExpandedMetric(isExpanded ? null : field)}
                className={`w-full text-left ${hasNote ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={!hasNote}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-body text-gray-700 flex items-center gap-1">
                    {def?.label || field}
                    {isInverted && <span className="text-xs text-gray-400">(lower is better)</span>}
                    {hasNote && (
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    )}
                  </span>
                  <span className={`font-semibold ${isInverted ? getInvertedScoreColor(score) : getScoreColor(score)}`}>
                    {score}/10
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isInverted ? getInvertedScoreBarColor(score) : getScoreBarColor(score)}`}
                    style={{ width: `${score * 10}%` }}
                  />
                </div>
              </button>
              {/* Expanded note */}
              {isExpanded && note && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
                  {note}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'text-success'
  if (score >= 5) return 'text-warning'
  return 'text-danger'
}

function getScoreBarColor(score: number): string {
  if (score >= 7) return 'bg-success'
  if (score >= 5) return 'bg-warning'
  return 'bg-danger'
}

// For maintenance, lower is better
function getInvertedScoreColor(score: number): string {
  if (score <= 3) return 'text-success'
  if (score <= 6) return 'text-warning'
  return 'text-danger'
}

function getInvertedScoreBarColor(score: number): string {
  if (score <= 3) return 'bg-success'
  if (score <= 6) return 'bg-warning'
  return 'bg-danger'
}
