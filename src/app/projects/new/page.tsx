'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UpgradePrompt } from '@/components/UpgradePrompt'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [autoEvaluate, setAutoEvaluate] = useState(true)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUpgradeRequired(false)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const url = formData.get('url') as string

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Check if upgrade is required
        if (data.error?.upgradeRequired) {
          setUpgradeRequired(true)
          setUpgradeMessage(data.error.message)
          return
        }
        throw new Error(data.error?.message || data.error || 'Failed to create project')
      }

      toast.success('Project created!', {
        description: autoEvaluate
          ? 'Starting AI analysis...'
          : `${data.name} has been added to your portfolio.`,
      })

      // Redirect to AI evaluation or project detail
      if (autoEvaluate) {
        router.push(`/projects/${data.id}/ai-evaluate`)
      } else {
        router.push(`/projects/${data.id}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error('Failed to create project', {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
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
        <h1 className="text-heading font-bold text-gray-900">Add Project</h1>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          name="name"
          label="Project Name"
          placeholder="My Awesome App"
          required
          autoComplete="off"
        />

        <Input
          name="url"
          label="URL"
          type="url"
          placeholder="https://myapp.com"
          required
          autoComplete="off"
        />

        {/* AI Auto-evaluate checkbox */}
        <label className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={autoEvaluate}
            onChange={(e) => setAutoEvaluate(e.target.checked)}
            className="w-6 h-6 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Auto-evaluate with AI
            </div>
            <p className="text-sm text-gray-500 mt-1">
              AI will analyze your app and suggest scores. You&apos;ll add personal ratings after.
            </p>
          </div>
        </label>

        {error && (
          <div className="bg-red-50 text-danger p-4 rounded-xl text-body">
            {error}
          </div>
        )}

        {upgradeRequired && (
          <UpgradePrompt
            title="Project Limit Reached"
            message={upgradeMessage}
          />
        )}

        {!upgradeRequired && (
          <Button type="submit" size="large" loading={loading}>
            Add Project
          </Button>
        )}
      </form>

      {/* Batch add link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Have multiple sites?{' '}
          <Link href="/projects/batch" className="text-primary font-medium hover:underline">
            Add them all at once
          </Link>
        </p>
      </div>
    </div>
  )
}
