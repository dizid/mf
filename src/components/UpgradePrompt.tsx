import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface UpgradePromptProps {
  title?: string
  message: string
  showButton?: boolean
}

export function UpgradePrompt({
  title = 'Upgrade Required',
  message,
  showButton = true,
}: UpgradePromptProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-body text-gray-600 mb-4">{message}</p>
          {showButton && (
            <Link href="/pricing">
              <Button size="large" className="w-full">
                View Plans
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}

// Inline upgrade banner for use in lists/forms
export function UpgradeBanner({ message }: { message: string }) {
  return (
    <Link href="/pricing">
      <div className="bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl p-4 flex items-center gap-3">
        <svg
          className="w-6 h-6 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  )
}
