'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function PricingPageClient() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast.success('Welcome to your new plan!', {
        description: 'Your subscription is now active.',
      })
      // Clean URL
      window.history.replaceState({}, '', '/pricing')
    }

    if (canceled === 'true') {
      toast.info('Checkout canceled', {
        description: 'No changes were made to your account.',
      })
      // Clean URL
      window.history.replaceState({}, '', '/pricing')
    }
  }, [searchParams])

  return null
}
