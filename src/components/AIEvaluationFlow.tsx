'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { metricDefinitions } from '@/lib/scoring'

interface AIEvaluationFlowProps {
  projectId: string
  projectName: string
}

type Step = 'loading' | 'review' | 'personal' | 'saving'

interface AIScores {
  usability: number
  value: number
  features: number
  polish: number
  competition: number
  market: number
  monetization: number
  maintenance: number
  growth: number
}

interface AIReasoning {
  usability: string
  value: string
  features: string
  polish: string
  competition: string
  market: string
  monetization: string
  maintenance: string
  growth: string
  summary: string
}

interface FirstImpressions {
  whatItDoes: string
  targetUser: string
  trustLevel: 'low' | 'medium' | 'high'
}

const personalMetrics = ['passion', 'learning', 'pride'] as const
type PersonalMetric = typeof personalMetrics[number]

export function AIEvaluationFlow({ projectId, projectName }: AIEvaluationFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('loading')
  const [loadingStage, setLoadingStage] = useState(0)
  const [error, setError] = useState('')

  // AI-generated scores
  const [aiScores, setAiScores] = useState<AIScores | null>(null)
  const [aiReasoning, setAiReasoning] = useState<AIReasoning | null>(null)
  const [firstImpressions, setFirstImpressions] = useState<FirstImpressions | null>(null)
  const [recommendations, setRecommendations] = useState<string[] | null>(null)

  // Personal scores (user-provided)
  const [personalScores, setPersonalScores] = useState<Record<PersonalMetric, number | null>>({
    passion: null,
    learning: null,
    pride: null,
  })
  const [personalStep, setPersonalStep] = useState(0)

  // Run AI evaluation on mount
  useEffect(() => {
    runAIEvaluation()
  }, [projectId])

  // Simulate loading progress
  useEffect(() => {
    if (step !== 'loading') return

    const stages = [
      { delay: 500, stage: 1 },   // Fetching page data
      { delay: 2000, stage: 2 },  // Analyzing performance
      { delay: 4000, stage: 3 },  // AI analyzing content
    ]

    const timers = stages.map(({ delay, stage }) =>
      setTimeout(() => setLoadingStage(stage), delay)
    )

    return () => timers.forEach(clearTimeout)
  }, [step])

  async function runAIEvaluation() {
    setStep('loading')
    setError('')

    try {
      const res = await fetch('/api/ai-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || 'AI evaluation failed')
      }

      setAiScores(data.scores)
      setAiReasoning(data.reasoning)
      setFirstImpressions(data.firstImpressions)
      setRecommendations(data.recommendations)
      setStep('review')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error('AI Evaluation Failed', { description: message })
    }
  }

  // Save with neutral default personal scores (5/10)
  async function saveWithDefaults() {
    setPersonalScores({ passion: 5, learning: 5, pride: 5 })
    setStep('saving')

    try {
      const allScores = {
        ...aiScores,
        passion: 5,
        learning: 5,
        pride: 5,
      }

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          scores: allScores,
          notes: {
            usability: aiReasoning?.usability,
            value: aiReasoning?.value,
            features: aiReasoning?.features,
            polish: aiReasoning?.polish,
            competition: aiReasoning?.competition,
            market: aiReasoning?.market,
            monetization: aiReasoning?.monetization,
            maintenance: aiReasoning?.maintenance,
            growth: aiReasoning?.growth,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to save')
      }

      const evaluation = await res.json()
      toast.success(`Recommendation: ${evaluation.recommendation?.toUpperCase()}`, {
        description: `Overall score: ${Number(evaluation.overallScore).toFixed(1)}/10`,
      })

      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error('Failed to save', { description: message })
      setStep('review')
    }
  }

  async function saveEvaluation() {
    setStep('saving')

    try {
      const allScores = {
        ...aiScores,
        passion: personalScores.passion,
        learning: personalScores.learning,
        pride: personalScores.pride,
      }

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          scores: allScores,
          notes: {
            usability: aiReasoning?.usability,
            value: aiReasoning?.value,
            features: aiReasoning?.features,
            polish: aiReasoning?.polish,
            competition: aiReasoning?.competition,
            market: aiReasoning?.market,
            monetization: aiReasoning?.monetization,
            maintenance: aiReasoning?.maintenance,
            growth: aiReasoning?.growth,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to save')
      }

      const evaluation = await res.json()
      toast.success(`Recommendation: ${evaluation.recommendation?.toUpperCase()}`, {
        description: `Overall score: ${Number(evaluation.overallScore).toFixed(1)}/10`,
      })

      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error('Failed to save', { description: message })
      setStep('personal')
    }
  }

  // Loading state
  if (step === 'loading') {
    const stages = [
      'Starting analysis...',
      'Checking page performance...',
      'Analyzing website content...',
      'AI evaluating metrics...',
    ]

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 mb-6">
          <div className="w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-heading font-bold text-gray-900 mb-2">
          Analyzing {projectName}
        </h2>
        <p className="text-body text-gray-500 mb-8">
          {stages[loadingStage]}
        </p>
        <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}
          />
        </div>

        {error && (
          <div className="mt-8 bg-red-50 text-danger p-4 rounded-xl text-body max-w-sm text-center">
            {error}
            <Button onClick={runAIEvaluation} className="mt-4 mx-auto">
              Try Again
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Review AI scores
  if (step === 'review') {
    const productMetrics = ['usability', 'value', 'features', 'polish', 'competition'] as const
    const businessMetrics = ['market', 'monetization', 'maintenance', 'growth'] as const

    return (
      <div className="min-h-screen flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-heading font-bold text-gray-900">AI Analysis Results</h1>
          <p className="text-label text-gray-500">{projectName}</p>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {/* First Impressions */}
          {firstImpressions && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
              <h3 className="text-label font-semibold text-blue-800 mb-3">FIRST IMPRESSIONS</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-gray-700">What it does:</span> <span className="text-gray-600">{firstImpressions.whatItDoes}</span></p>
                <p><span className="font-medium text-gray-700">Target user:</span> <span className="text-gray-600">{firstImpressions.targetUser}</span></p>
                <p>
                  <span className="font-medium text-gray-700">Trust level:</span>{' '}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    firstImpressions.trustLevel === 'high' ? 'bg-green-100 text-green-800' :
                    firstImpressions.trustLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {firstImpressions.trustLevel}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-primary/5 p-4 rounded-xl mb-6">
            <p className="text-body text-gray-700">{aiReasoning?.summary}</p>
          </div>

          {/* Product Scores */}
          <div className="mb-6">
            <h3 className="text-label font-semibold text-gray-500 mb-3">PRODUCT QUALITY</h3>
            <div className="space-y-3">
              {productMetrics.map(key => (
                <ScoreRow
                  key={key}
                  label={metricDefinitions[key].label}
                  score={aiScores?.[key] ?? 0}
                  reason={aiReasoning?.[key] ?? ''}
                />
              ))}
            </div>
          </div>

          {/* Business Scores */}
          <div className="mb-6">
            <h3 className="text-label font-semibold text-gray-500 mb-3">BUSINESS VIABILITY</h3>
            <div className="space-y-3">
              {businessMetrics.map(key => (
                <ScoreRow
                  key={key}
                  label={metricDefinitions[key].label}
                  score={aiScores?.[key] ?? 0}
                  reason={aiReasoning?.[key] ?? ''}
                  inverted={key === 'maintenance'}
                />
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6">
              <h3 className="text-label font-semibold text-amber-800 mb-3">TOP RECOMMENDATIONS</h3>
              <ul className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-800">
                      {idx + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 safe-bottom space-y-3">
          <Button onClick={() => setStep('personal')} className="w-full">
            Continue to Personal Ratings
          </Button>
          <Button
            variant="secondary"
            onClick={saveWithDefaults}
            className="w-full"
          >
            Skip & Save Now
          </Button>
        </div>
      </div>
    )
  }

  // Personal metrics input
  if (step === 'personal' || step === 'saving') {
    const currentMetric = personalMetrics[personalStep]
    const definition = metricDefinitions[currentMetric]
    const currentScore = personalScores[currentMetric]
    const isLastStep = personalStep === personalMetrics.length - 1

    return (
      <div className="min-h-screen flex flex-col">
        {/* Progress */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((personalStep + 1) / personalMetrics.length) * 100}%` }}
          />
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="text-label text-gray-500">
            Personal Ratings for {projectName}
          </div>
          <div className="text-sm text-primary font-medium">
            {personalStep + 1} of {personalMetrics.length}
          </div>
        </div>

        <div className="flex-1 p-4">
          <h2 className="text-heading font-bold text-gray-900 mb-2">
            {definition.label}
          </h2>
          <p className="text-body text-gray-600 mb-8">
            {definition.question}
          </p>

          {/* Score buttons (1-10) */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
              <button
                key={value}
                onClick={() => setPersonalScores(prev => ({ ...prev, [currentMetric]: value }))}
                className={`
                  h-14 rounded-xl text-lg font-semibold transition-all
                  ${currentScore === value
                    ? 'bg-primary text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {value}
              </button>
            ))}
          </div>

          {/* Hints */}
          <div className="space-y-2">
            {[1, 5, 10].map((level) => (
              <div
                key={level}
                className={`flex items-center gap-2 text-sm ${
                  currentScore === level ? 'text-primary font-medium' : 'text-gray-400'
                }`}
              >
                <span className="w-6 text-right">{level}:</span>
                <span>{definition.hints[level as 1 | 5 | 10]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 safe-bottom">
          <div className="flex gap-3">
            {personalStep > 0 && (
              <Button
                variant="secondary"
                onClick={() => setPersonalStep(personalStep - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}

            {!isLastStep ? (
              <Button
                onClick={() => setPersonalStep(personalStep + 1)}
                className="flex-1"
                disabled={currentScore === null}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={saveEvaluation}
                loading={step === 'saving'}
                className="flex-1"
                disabled={currentScore === null}
              >
                Save Evaluation
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Score row component
function ScoreRow({
  label,
  score,
  reason,
  inverted = false,
}: {
  label: string
  score: number
  reason: string
  inverted?: boolean
}) {
  // Color based on score (inverted for maintenance)
  const effectiveScore = inverted ? 11 - score : score
  const color =
    effectiveScore >= 7 ? 'bg-green-500' :
    effectiveScore >= 5 ? 'bg-yellow-500' :
    'bg-red-500'

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{label}</span>
        <span className={`w-8 h-8 rounded-full ${color} text-white flex items-center justify-center text-sm font-bold`}>
          {score}
        </span>
      </div>
      <p className="text-sm text-gray-500">{reason}</p>
    </div>
  )
}
