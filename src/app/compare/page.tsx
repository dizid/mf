'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RecommendationBadge } from '@/components/RecommendationBadge'

interface Evaluation {
  overallScore: string | null
  productScore: string | null
  businessScore: string | null
  personalScore: string | null
  recommendation: string | null
}

interface Project {
  id: string
  name: string
  url: string
  evaluation: Evaluation | null
}

export default function ComparePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="p-4">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-heading font-bold text-gray-900">Compare</h1>
        <p className="text-body text-gray-600">
          {evaluatedProjects.length === 0
            ? 'Rate some projects first to compare them'
            : 'Select 2-3 evaluated projects'
          }
        </p>
      </header>

      {/* Project Selection */}
      {selected.length < 2 && evaluatedProjects.length > 0 && (
        <div className="space-y-3 mb-6">
          {evaluatedProjects.map(project => {
            const overallScore = getScore(project.evaluation?.overallScore)
            return (
              <button
                key={project.id}
                onClick={() => toggleSelect(project.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  selected.includes(project.id)
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
        </div>
      )}

      {/* Comparison View */}
      {selected.length >= 2 && (
        <div>
          <Button
            variant="secondary"
            onClick={() => setSelected([])}
            className="mb-6"
          >
            Clear Selection
          </Button>

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

          {/* Category Comparison */}
          {[
            { key: 'productScore', label: 'Product Quality', description: 'Usability, value, features, polish, competition' },
            { key: 'businessScore', label: 'Business Viability', description: 'Market, monetization, maintenance, growth' },
            { key: 'personalScore', label: 'Personal Investment', description: 'Passion, learning, pride' },
          ].map(({ key, label, description }) => (
            <Card key={key} className="mb-3">
              <div className="mb-3">
                <span className="font-medium text-gray-700">{label}</span>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
              <div className="flex gap-4">
                {selectedProjects.map(p => {
                  const score = getScore(p.evaluation?.[key as keyof Evaluation] as string | null)
                  return (
                    <div key={p.id} className="flex-1">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getScoreBarColor(score)}`}
                          style={{ width: `${(score ?? 0) * 10}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-400 truncate">{p.name}</span>
                        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                          {score !== null ? score.toFixed(1) : '-'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
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
