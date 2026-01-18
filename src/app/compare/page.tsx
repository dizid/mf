'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RecommendationBadge } from '@/components/RecommendationBadge'
import { metricDefinitions, type MetricKey } from '@/lib/scoring'

interface Evaluation {
  overallScore: string | null
  productScore: string | null
  businessScore: string | null
  personalScore: string | null
  recommendation: string | null
  // Individual metrics
  scoreUsability?: number | null
  scoreValue?: number | null
  scoreFeatures?: number | null
  scorePolish?: number | null
  scoreCompetition?: number | null
  scoreMarket?: number | null
  scoreMonetization?: number | null
  scoreMaintenance?: number | null
  scoreGrowth?: number | null
  scorePassion?: number | null
  scoreLearning?: number | null
  scorePride?: number | null
}

interface Project {
  id: string
  name: string
  url: string
  evaluation: Evaluation | null
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

const categoryMetrics = {
  product: ['scoreUsability', 'scoreValue', 'scoreFeatures', 'scorePolish', 'scoreCompetition'],
  business: ['scoreMarket', 'scoreMonetization', 'scoreMaintenance', 'scoreGrowth'],
  personal: ['scorePassion', 'scoreLearning', 'scorePride'],
}

export default function ComparePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects')
        return res.json()
      })
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
  }

  // Filter to only projects that have been evaluated
  const evaluatedProjects = projects.filter(p => p.evaluation?.overallScore)
  const selectedProjects = evaluatedProjects.filter(p => selected.includes(p.id))

  // Helper to get score as number
  const getScore = (score: string | null | undefined): number | null => {
    if (!score) return null
    return Number(score)
  }

  // Helper for score color (using 1-10 scale)
  const getScoreColor = (score: number | null): string => {
    if (score === null) return 'text-gray-400'
    if (score >= 7) return 'text-success'
    if (score >= 5) return 'text-warning'
    return 'text-danger'
  }

  const getScoreBarColor = (score: number | null): string => {
    if (score === null) return 'bg-gray-200'
    if (score >= 7) return 'bg-success'
    if (score >= 5) return 'bg-warning'
    return 'bg-danger'
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-body text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="bg-red-50 border-red-200">
          <p className="text-body text-danger">{error}</p>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  const unselectedProjects = evaluatedProjects.filter(p => !selected.includes(p.id))

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-heading font-bold text-gray-900">Compare</h1>
        <p className="text-body text-gray-600">
          {evaluatedProjects.length === 0
            ? 'Rate some projects first to compare them'
            : selected.length < 2
              ? 'Select 2-3 evaluated projects'
              : `Comparing ${selected.length} projects`
          }
        </p>
      </header>

      {/* Selected Projects Chips - Always visible when there are selections */}
      {selected.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {selectedProjects.map(p => (
              <button
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-full text-sm font-medium"
              >
                <span className="truncate max-w-[120px]">{p.name}</span>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
            {selected.length < 3 && unselectedProjects.length > 0 && (
              <button
                onClick={() => setShowAllProjects(!showAllProjects)}
                className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            )}
          </div>
        </div>
      )}

      {/* Project Selection - show when not enough selected OR when user clicked "Add" */}
      {((selected.length < 2 || showAllProjects) && evaluatedProjects.length > 0) && (
        <div className="space-y-3 mb-6">
          {(showAllProjects ? unselectedProjects : evaluatedProjects).map(project => {
            const overallScore = getScore(project.evaluation?.overallScore)
            const isSelected = selected.includes(project.id)
            return (
              <button
                key={project.id}
                onClick={() => {
                  toggleSelect(project.id)
                  if (!isSelected && selected.length >= 1) {
                    setShowAllProjects(false)
                  }
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  isSelected
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900">{project.name}</div>
                      {project.evaluation?.recommendation && (
                        <RecommendationBadge
                          recommendation={project.evaluation.recommendation}
                          size="small"
                        />
                      )}
                    </div>
                    <div className="text-label text-gray-500 truncate">
                      {project.url.replace(/^https?:\/\//, '')}
                    </div>
                  </div>
                  <div className={`text-xl font-bold ml-4 ${getScoreColor(overallScore)}`}>
                    {overallScore !== null ? overallScore.toFixed(1) : '-'}
                  </div>
                </div>
              </button>
            )
          })}
          {showAllProjects && (
            <Button
              variant="secondary"
              onClick={() => setShowAllProjects(false)}
              className="w-full"
            >
              Done Adding
            </Button>
          )}
        </div>
      )}

      {/* Comparison View */}
      {selected.length >= 2 && !showAllProjects && (
        <div>

          {/* Overall Scores */}
          <Card className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-4">Overall Score</h3>
            <div className="flex gap-4">
              {selectedProjects.map(p => {
                const overallScore = getScore(p.evaluation?.overallScore)
                return (
                  <div key={p.id} className="flex-1 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                      {overallScore !== null ? overallScore.toFixed(1) : '-'}
                    </div>
                    <div className="text-label text-gray-500 truncate">{p.name}</div>
                    {p.evaluation?.recommendation && (
                      <div className="mt-2">
                        <RecommendationBadge
                          recommendation={p.evaluation.recommendation}
                          size="small"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Category Comparison with Expandable Metrics */}
          {[
            { key: 'productScore', catKey: 'product', label: 'Product Quality', description: 'Usability, value, features, polish, competition' },
            { key: 'businessScore', catKey: 'business', label: 'Business Viability', description: 'Market, monetization, maintenance, growth' },
            { key: 'personalScore', catKey: 'personal', label: 'Personal Investment', description: 'Passion, learning, pride' },
          ].map(({ key, catKey, label, description }) => {
            const isExpanded = expandedCategory === catKey
            const metrics = categoryMetrics[catKey as keyof typeof categoryMetrics]

            // Find winner for category
            const categoryScores = selectedProjects.map(p => ({
              id: p.id,
              score: getScore(p.evaluation?.[key as keyof Evaluation] as string | null)
            }))
            const maxCatScore = Math.max(...categoryScores.filter(s => s.score !== null).map(s => s.score!))
            const catWinnerId = categoryScores.find(s => s.score === maxCatScore)?.id

            return (
              <Card key={key} className="mb-3">
                {/* Category Header - Clickable to expand */}
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : catKey)}
                  className="w-full text-left"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="font-medium text-gray-700">{label}</span>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Category Score Bars */}
                <div className="flex gap-4">
                  {selectedProjects.map(p => {
                    const score = getScore(p.evaluation?.[key as keyof Evaluation] as string | null)
                    const isWinner = p.id === catWinnerId && categoryScores.filter(s => s.score === maxCatScore).length === 1
                    return (
                      <div key={p.id} className="flex-1">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getScoreBarColor(score)}`}
                            style={{ width: `${(score ?? 0) * 10}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-400 truncate flex items-center gap-1">
                            {p.name}
                            {isWinner && <span className="text-yellow-500">★</span>}
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                            {score !== null ? score.toFixed(1) : '-'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Expanded Individual Metrics */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {metrics.map(field => {
                      const metricKey = fieldToKey[field]
                      const def = metricDefinitions[metricKey]
                      const isInverted = metricKey === 'maintenance'

                      // Get scores for all selected projects
                      const metricScores = selectedProjects.map(p => ({
                        id: p.id,
                        name: p.name,
                        score: p.evaluation?.[field as keyof Evaluation] as number | null ?? null
                      }))

                      // Find winner (for maintenance, lower is better)
                      const validScores = metricScores.filter(s => s.score !== null)
                      let winnerId: string | null = null
                      if (validScores.length > 0) {
                        if (isInverted) {
                          const minScore = Math.min(...validScores.map(s => s.score!))
                          const winners = validScores.filter(s => s.score === minScore)
                          if (winners.length === 1) winnerId = winners[0].id
                        } else {
                          const maxScore = Math.max(...validScores.map(s => s.score!))
                          const winners = validScores.filter(s => s.score === maxScore)
                          if (winners.length === 1) winnerId = winners[0].id
                        }
                      }

                      return (
                        <div key={field}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">
                              {def.label}
                              {isInverted && <span className="text-xs text-gray-400 ml-1">(lower is better)</span>}
                            </span>
                          </div>
                          <div className="flex gap-4">
                            {metricScores.map(({ id, name, score }) => {
                              const isWinner = id === winnerId
                              return (
                                <div key={id} className="flex-1">
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        isInverted
                                          ? (score !== null && score <= 3 ? 'bg-success' : score !== null && score <= 6 ? 'bg-warning' : 'bg-danger')
                                          : getScoreBarColor(score)
                                      }`}
                                      style={{ width: `${(score ?? 0) * 10}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-400 truncate flex items-center gap-0.5">
                                      {name.substring(0, 8)}
                                      {isWinner && <span className="text-yellow-500 text-xs">★</span>}
                                    </span>
                                    <span className={`text-xs font-medium ${
                                      isInverted
                                        ? (score !== null && score <= 3 ? 'text-success' : score !== null && score <= 6 ? 'text-warning' : 'text-danger')
                                        : getScoreColor(score)
                                    }`}>
                                      {score !== null ? score : '-'}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty states */}
      {projects.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-body text-gray-500 mb-2">No projects yet</p>
          <p className="text-label text-gray-400">Add some projects first, then rate them to compare</p>
        </Card>
      )}

      {projects.length > 0 && evaluatedProjects.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-body text-gray-500 mb-2">No evaluated projects</p>
          <p className="text-label text-gray-400">Rate your projects first to compare their scores</p>
        </Card>
      )}

      {evaluatedProjects.length === 1 && (
        <Card className="text-center py-8">
          <p className="text-body text-gray-500 mb-2">Need more projects to compare</p>
          <p className="text-label text-gray-400">Rate at least 2 projects to compare them</p>
        </Card>
      )}
    </div>
  )
}
