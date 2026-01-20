'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { BatchItem } from '@/hooks/useBatchEvaluation'

interface BatchProgressTrackerProps {
  queue: BatchItem[]
  isProcessing: boolean
  progress: { completed: number; failed: number; total: number }
  onPause: () => void
  onResume: () => void
  onRetryFailed: () => void
  onClear: () => void
}

export function BatchProgressTracker({
  queue,
  isProcessing,
  progress,
  onPause,
  onResume,
  onRetryFailed,
  onClear,
}: BatchProgressTrackerProps) {
  const hasProcessing = queue.some(i => i.status === 'creating' || i.status === 'evaluating')
  const hasPending = queue.some(i => i.status === 'pending')
  const hasFailed = progress.failed > 0
  const allDone = progress.completed + progress.failed === progress.total

  const progressPercent = progress.total > 0
    ? Math.round(((progress.completed + progress.failed) / progress.total) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            {progress.completed} of {progress.total} completed
            {progress.failed > 0 && <span className="text-red-600"> ({progress.failed} failed)</span>}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${(progress.failed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
        {queue.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 ${
              item.status === 'failed' ? 'bg-red-50' : ''
            }`}
          >
            {/* Status Icon */}
            <span className="flex-shrink-0">
              {item.status === 'pending' && (
                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                  ⏳
                </span>
              )}
              {(item.status === 'creating' || item.status === 'evaluating') && (
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </span>
              )}
              {item.status === 'completed' && (
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                  ✓
                </span>
              )}
              {item.status === 'failed' && (
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">
                  ✕
                </span>
              )}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">{item.name}</span>
                {item.status === 'creating' && (
                  <span className="text-xs text-blue-600">Creating project...</span>
                )}
                {item.status === 'evaluating' && (
                  <span className="text-xs text-blue-600">AI analyzing...</span>
                )}
              </div>
              {item.status === 'failed' && item.error && (
                <div className="text-xs text-red-600 truncate">{item.error}</div>
              )}
              {item.status !== 'failed' && (
                <div className="text-xs text-gray-500 truncate">{item.url}</div>
              )}
            </div>

            {/* View Link */}
            {item.status === 'completed' && item.projectId && (
              <Link
                href={`/projects/${item.projectId}`}
                className="text-sm text-primary font-medium hover:underline"
              >
                View
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!allDone && (
          <>
            {hasProcessing || (hasPending && isProcessing) ? (
              <Button variant="secondary" onClick={onPause} className="flex-1">
                Pause
              </Button>
            ) : hasPending ? (
              <Button onClick={onResume} className="flex-1">
                {progress.completed > 0 ? 'Resume' : 'Start Processing'}
              </Button>
            ) : null}
          </>
        )}

        {hasFailed && (
          <Button variant="secondary" onClick={onRetryFailed} className="flex-1">
            Retry Failed
          </Button>
        )}

        {allDone && (
          <Button variant="secondary" onClick={onClear} className="flex-1">
            Clear & Add More
          </Button>
        )}
      </div>

      {/* Warning about tab */}
      {(hasProcessing || (hasPending && isProcessing)) && (
        <p className="text-xs text-amber-600 text-center">
          Keep this tab open while processing. Each site takes 30-60 seconds.
        </p>
      )}
    </div>
  )
}
