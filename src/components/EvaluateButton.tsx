'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface EvaluateButtonProps {
  projectId: string
}

export function EvaluateButton({ projectId }: EvaluateButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEvaluate() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to start evaluation')
      }

      // Refresh the page to show the new evaluation status
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handleEvaluate}
        loading={loading}
        size="large"
        className="w-full"
      >
        Run Evaluation
      </Button>
      {error && (
        <p className="text-danger text-label mt-2">{error}</p>
      )}
    </div>
  )
}
