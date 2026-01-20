'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BatchProjectInput } from '@/components/BatchProjectInput'
import { BatchProgressTracker } from '@/components/BatchProgressTracker'
import { useBatchEvaluation } from '@/hooks/useBatchEvaluation'

interface Limits {
  projects: {
    remaining: number
    limit: number
    used: number
  }
}

export default function BatchProjectsPage() {
  const router = useRouter()
  const [limits, setLimits] = useState<Limits | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    queue,
    isProcessing,
    progress,
    addToQueue,
    startProcessing,
    pauseProcessing,
    retryFailed,
    clearQueue,
  } = useBatchEvaluation()

  // Fetch limits on mount
  useEffect(() => {
    fetch('/api/limits')
      .then(res => res.json())
      .then(data => {
        setLimits(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSubmit = (items: { name: string; url: string }[]) => {
    addToQueue(items)
    startProcessing()
  }

  const maxProjects = limits?.projects.remaining ?? 3

  return (
    <div className="p-4 min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-primary font-medium mb-2 flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-heading font-bold text-gray-900">Add Multiple Sites</h1>
        <p className="text-body text-gray-500 mt-1">
          Paste URLs and we&apos;ll evaluate them all with AI
        </p>
      </header>

      {/* Limits Info */}
      {!loading && limits && (
        <div className="bg-gray-50 p-3 rounded-xl mb-6 text-sm">
          <span className="text-gray-600">
            You can add up to <strong className="text-gray-900">{maxProjects}</strong> more sites
          </span>
          <span className="text-gray-400 ml-2">
            ({limits.projects.used} of {limits.projects.limit} used)
          </span>
        </div>
      )}

      {/* Show input when queue is empty */}
      {queue.length === 0 && (
        <BatchProjectInput
          onSubmit={handleSubmit}
          maxProjects={maxProjects}
          disabled={loading || maxProjects === 0}
        />
      )}

      {/* Show progress when queue has items */}
      {queue.length > 0 && (
        <BatchProgressTracker
          queue={queue}
          isProcessing={isProcessing}
          progress={progress}
          onPause={pauseProcessing}
          onResume={startProcessing}
          onRetryFailed={retryFailed}
          onClear={clearQueue}
        />
      )}

      {/* Upgrade prompt if at limit */}
      {!loading && maxProjects === 0 && queue.length === 0 && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
          <h3 className="font-medium text-amber-800 mb-2">Project Limit Reached</h3>
          <p className="text-sm text-amber-700 mb-4">
            You&apos;ve used all {limits?.projects.limit} project slots. Upgrade to add more.
          </p>
          <Link
            href="/settings"
            className="inline-block bg-primary text-white px-4 py-2 rounded-lg font-medium text-sm"
          >
            View Plans
          </Link>
        </div>
      )}

      {/* Single project alternative */}
      {queue.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Want to add just one?{' '}
            <Link href="/projects/new" className="text-primary font-medium hover:underline">
              Add single project
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
