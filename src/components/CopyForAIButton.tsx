'use client'

import { useState } from 'react'

interface CopyForAIButtonProps {
  content: string
  className?: string
}

export function CopyForAIButton({ content, className = '' }: CopyForAIButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center gap-2 px-4 min-h-touch
        bg-white border-2 border-gray-200 rounded-xl
        text-body font-medium text-gray-700
        active:bg-gray-100 transition-colors
        ${copied ? 'border-success text-success' : ''}
        ${className}
      `}
    >
      {copied ? (
        <>
          <CheckIcon className="w-5 h-5" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <ClipboardIcon className="w-5 h-5" />
          <span>Copy for AI</span>
        </>
      )}
    </button>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
