import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">404</span>
        </div>

        <h1 className="text-heading font-bold text-gray-900 mb-2">
          Page not found
        </h1>

        <p className="text-body text-gray-600 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="space-y-3">
          <Link href="/">
            <Button size="large" className="w-full">
              Go to Dashboard
            </Button>
          </Link>

          <Link href="/projects">
            <Button variant="secondary" size="large" className="w-full">
              View Projects
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
