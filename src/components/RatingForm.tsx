'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { metricDefinitions, type MetricKey } from '@/lib/scoring'

interface RatingFormProps {
  projectId: string
  projectName: string
  initialScores?: Partial<Record<MetricKey, number>>
  initialNotes?: Partial<Record<MetricKey, string>>
}

const metricOrder: MetricKey[] = [
  // Product first
  'usability', 'value', 'features', 'polish', 'competition',
  // Then business
  'market', 'monetization', 'maintenance', 'growth',
  // Then personal
  'passion', 'learning', 'pride',
]

export function RatingForm({ projectId, projectName, initialScores = {}, initialNotes = {} }: RatingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Partial<Record<MetricKey, number>>>(initialScores)
  const [notes, setNotes] = useState<Partial<Record<MetricKey, string>>>(initialNotes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentMetric = metricOrder[step]
  const definition = metricDefinitions[currentMetric]
  const progress = ((step + 1) / metricOrder.length) * 100

  const categoryLabels = {
    product: 'Product Quality',
    business: 'Business Viability',
    personal: 'Personal Investment',
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          scores,
          notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || data.error || 'Failed to save evaluation')
      }

      const evaluation = await res.json()
      const recommendation = evaluation.recommendation?.toUpperCase() || 'EVALUATED'

      toast.success(`Recommendation: ${recommendation}`, {
        description: `${projectName} has been evaluated with a score of ${Number(evaluation.overallScore).toFixed(1)}`,
      })

      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error('Failed to save evaluation', {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  function handleScoreChange(value: number) {
    setScores(prev => ({ ...prev, [currentMetric]: value }))
  }

  function handleNoteChange(value: string) {
    setNotes(prev => ({ ...prev, [currentMetric]: value }))
  }

  function nextStep() {
    if (step < metricOrder.length - 1) {
      setStep(step + 1)
    }
  }

  function prevStep() {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const currentScore = scores[currentMetric]
  const currentNote = notes[currentMetric] || ''
  const isLastStep = step === metricOrder.length - 1

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-label text-gray-500">
          Rating {projectName}
        </div>
        <div className="text-sm text-primary font-medium">
          {categoryLabels[definition.category]} • {step + 1} of {metricOrder.length}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">
        {/* Question */}
        <h2 className="text-heading font-bold text-gray-900 mb-2">
          {definition.label}
        </h2>
        <p className="text-body text-gray-600 mb-8">
          {definition.question}
        </p>

        {/* Score slider */}
        <div className="mb-8">
          <div className="flex justify-between text-label text-gray-500 mb-2">
            <span>1</span>
            <span className="text-2xl font-bold text-primary">
              {currentScore ?? '—'}
            </span>
            <span>10</span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            value={currentScore ?? 5}
            onChange={(e) => handleScoreChange(parseInt(e.target.value))}
            className="w-full h-12 appearance-none bg-gray-100 rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-12
              [&::-webkit-slider-thumb]:h-12
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-moz-range-thumb]:w-12
              [&::-moz-range-thumb]:h-12
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-primary
              [&::-moz-range-thumb]:border-0"
          />

          {/* Hints */}
          <div className="mt-4 space-y-2">
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

        {/* Notes */}
        <div>
          <label className="block text-label font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={currentNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Any thoughts on this metric..."
            className="w-full min-h-[100px] p-4 text-body rounded-xl border-2 border-gray-200
              focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-danger p-4 rounded-xl text-body">
            {error}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="p-4 border-t border-gray-100 safe-bottom">
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="secondary"
              onClick={prevStep}
              className="flex-1"
            >
              Back
            </Button>
          )}

          {!isLastStep ? (
            <Button
              onClick={nextStep}
              className="flex-1"
              disabled={currentScore === undefined}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={loading}
              className="flex-1"
              disabled={currentScore === undefined}
            >
              Save Evaluation
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
