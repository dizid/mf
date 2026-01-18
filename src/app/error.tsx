'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-heading font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>

        <p className="text-body text-gray-600 mb-6">
          We encountered an unexpected error. This has been logged and we&apos;ll look into it.
        </p>

        <div className="space-y-3">
          <Button onClick={reset} size="large" className="w-full">
            Try Again
          </Button>

          <Button
            variant="secondary"
            onClick={() => window.location.href = '/'}
            size="large"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-400 mt-6">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
