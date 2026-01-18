'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
        description: `${data.name} has been added to your portfolio.`,
      })
      router.push(`/projects/${data.id}`)
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
    </div>
  )
}
