'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface BatchProjectInputProps {
  onSubmit: (projects: { name: string; url: string }[]) => void
  maxProjects: number
  disabled?: boolean
}

// Extract domain name from URL for project name
function extractProjectName(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove www. prefix and get just the domain
    let domain = urlObj.hostname.replace(/^www\./, '')
    // Take first part if it's a subdomain
    const parts = domain.split('.')
    if (parts.length > 2) {
      domain = parts[0]
    } else {
      domain = parts[0]
    }
    // Capitalize first letter
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  } catch {
    return 'Unknown Project'
  }
}

// Validate URL format
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Normalize URL (add https:// if missing)
function normalizeUrl(url: string): string {
  url = url.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }
  return url
}

export function BatchProjectInput({ onSubmit, maxProjects, disabled }: BatchProjectInputProps) {
  const [input, setInput] = useState('')
  const [parsedUrls, setParsedUrls] = useState<{ name: string; url: string; valid: boolean }[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const handleInputChange = (value: string) => {
    setInput(value)
    setShowPreview(false)
  }

  const parseUrls = () => {
    // Split by newlines and filter empty lines
    const lines = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    // Parse each line
    const parsed = lines.map(line => {
      const normalizedUrl = normalizeUrl(line)
      const valid = isValidUrl(normalizedUrl)
      return {
        name: valid ? extractProjectName(normalizedUrl) : line,
        url: normalizedUrl,
        valid,
      }
    })

    // Remove duplicates by URL
    const unique = parsed.filter((item, index, self) =>
      index === self.findIndex(t => t.url === item.url)
    )

    setParsedUrls(unique)
    setShowPreview(true)
  }

  const handleSubmit = () => {
    const validUrls = parsedUrls
      .filter(item => item.valid)
      .slice(0, maxProjects)
      .map(({ name, url }) => ({ name, url }))

    if (validUrls.length > 0) {
      onSubmit(validUrls)
      setInput('')
      setParsedUrls([])
      setShowPreview(false)
    }
  }

  const validCount = parsedUrls.filter(u => u.valid).length
  const invalidCount = parsedUrls.filter(u => !u.valid).length
  const willProcess = Math.min(validCount, maxProjects)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-label font-medium text-gray-700 mb-2">
          Paste URLs (one per line)
        </label>
        <textarea
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          placeholder={`https://example1.com\nhttps://example2.com\nhttps://example3.com`}
          className="w-full h-40 p-3 border border-gray-200 rounded-xl text-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          disabled={disabled}
        />
      </div>

      {!showPreview && (
        <Button
          onClick={parseUrls}
          className="w-full"
          disabled={!input.trim() || disabled}
        >
          Preview URLs
        </Button>
      )}

      {showPreview && parsedUrls.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">{validCount} valid</span>
            {invalidCount > 0 && (
              <span className="text-red-600">{invalidCount} invalid</span>
            )}
            {validCount > maxProjects && (
              <span className="text-amber-600">
                (only first {maxProjects} will be processed - upgrade for more)
              </span>
            )}
          </div>

          {/* URL List */}
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            {parsedUrls.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 ${
                  !item.valid ? 'bg-red-50' : idx >= maxProjects ? 'bg-gray-50 opacity-50' : ''
                }`}
              >
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  item.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.valid ? '✓' : '✕'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="text-sm text-gray-500 truncate">{item.url}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowPreview(false)}
              className="flex-1"
              disabled={disabled}
            >
              Edit
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={willProcess === 0 || disabled}
            >
              Add {willProcess} Site{willProcess !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
