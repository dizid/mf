'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

interface AIEvaluationFlowProps {
  projectId: string
  projectName: string
}

// Agent personas shown during loading
const AGENTS = [
  { id: 'first-timer', name: 'First-Timer', description: 'Browsing as a new visitor...' },
  { id: 'power-user', name: 'Power User', description: 'Analyzing features & UX...' },
  { id: 'business-analyst', name: 'Business Analyst', description: 'Evaluating market viability...' },
]

export function AIEvaluationFlow({ projectId, projectName }: AIEvaluationFlowProps) {
  const router = useRouter()
  const [loadingStage, setLoadingStage] = useState(0)
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(true)

  // Simulate progress through stages
  useEffect(() => {
    if (!isRunning) return

    const stages = [
      { delay: 800, stage: 1 },   // Scanning website
      { delay: 2500, stage: 2 },  // First-Timer evaluating
      { delay: 5000, stage: 3 },  // Power User evaluating
      { delay: 7500, stage: 4 },  // Business Analyst evaluating
      { delay: 10000, stage: 5 }, // Combining perspectives
    ]

    const timers = stages.map(({ delay, stage }) =>
      setTimeout(() => setLoadingStage(stage), delay)
    )

    return () => timers.forEach(clearTimeout)
  }, [isRunning])

  // Run AI evaluation on mount
  useEffect(() => {
    runEvaluation()
  }, [projectId])

  async function runEvaluation() {
    setError('')
    setIsRunning(true)
    setLoadingStage(0)

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

      // Evaluation is auto-saved by the API — show success and redirect
      const rec = data.evaluation?.recommendation?.toUpperCase() || 'COMPLETE'
      const score = data.evaluation?.overallScore
        ? Number(data.evaluation.overallScore).toFixed(1)
        : '—'

      toast.success(`Recommendation: ${rec}`, {
        description: `Overall score: ${score}/10`,
      })

      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setIsRunning(false)
      toast.error('AI Evaluation Failed', { description: message })
    }
  }

  // Loading stages with agent progress
  const stages = [
    'Scanning website...',
    `${AGENTS[0].name} is ${AGENTS[0].description.toLowerCase()}`,
    `${AGENTS[1].name} is ${AGENTS[1].description.toLowerCase()}`,
    `${AGENTS[2].name} is ${AGENTS[2].description.toLowerCase()}`,
    'Combining agent perspectives...',
    'Saving evaluation...',
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Spinner */}
      {isRunning && (
        <div className="w-16 h-16 mb-6">
          <div className="w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <h2 className="text-heading font-bold text-gray-900 mb-2">
        Analyzing {projectName}
      </h2>
      <p className="text-body text-gray-500 mb-6">
        {isRunning ? stages[loadingStage] : 'Evaluation stopped'}
      </p>

      {/* Agent status cards */}
      {isRunning && (
        <div className="w-full max-w-sm space-y-2 mb-8">
          {AGENTS.map((agent, idx) => {
            // Agent stages: 0=pending, their index+1=active, beyond=done
            const agentStageStart = idx + 1
            const status = loadingStage < agentStageStart
              ? 'pending'
              : loadingStage === agentStageStart
                ? 'active'
                : 'done'

            return (
              <div
                key={agent.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  status === 'active'
                    ? 'bg-primary/10 border border-primary/20'
                    : status === 'done'
                      ? 'bg-green-50 border border-green-100'
                      : 'bg-gray-50 border border-gray-100'
                }`}
              >
                {/* Status indicator */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  status === 'active'
                    ? 'bg-primary/20'
                    : status === 'done'
                      ? 'bg-green-200'
                      : 'bg-gray-200'
                }`}>
                  {status === 'done' ? (
                    <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : status === 'active' ? (
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    status === 'active' ? 'text-primary' :
                    status === 'done' ? 'text-green-700' :
                    'text-gray-400'
                  }`}>
                    {agent.name}
                  </p>
                  <p className={`text-xs truncate ${
                    status === 'active' ? 'text-gray-600' :
                    status === 'done' ? 'text-green-600' :
                    'text-gray-300'
                  }`}>
                    {status === 'done' ? 'Complete' : agent.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Progress bar */}
      {isRunning && (
        <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-8 bg-red-50 text-danger p-4 rounded-xl text-body max-w-sm text-center">
          {error}
          <Button onClick={runEvaluation} className="mt-4 mx-auto">
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
