'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TierName, Tier } from '@/lib/stripe'

interface PricingCardProps {
  tierKey: TierName
  tier: Tier
  isCurrentTier: boolean
  isSignedIn: boolean
}

export function PricingCard({
  tierKey,
  tier,
  isCurrentTier,
  isSignedIn,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      window.location.href = '/auth/signin'
      return
    }

    if (tierKey === 'free') return

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierKey }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error opening portal:', error)
    } finally {
      setLoading(false)
    }
  }

  const isPro = tierKey === 'pro'
  const isFree = tierKey === 'free'

  return (
    <Card
      className={`relative ${
        isPro ? 'border-2 border-primary ring-2 ring-primary/20' : ''
      }`}
    >
      {/* Popular badge */}
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentTier && (
        <div className="absolute -top-3 right-4">
          <span className="bg-success text-white text-xs font-semibold px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}

      <div className="pt-2">
        {/* Tier name and price */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-gray-900">
              ${tier.price}
            </span>
            {tier.price > 0 && (
              <span className="text-body text-gray-500">/month</span>
            )}
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-body text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        {isCurrentTier ? (
          isFree ? (
            <Button variant="secondary" size="large" className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="large"
              className="w-full"
              onClick={handleManageSubscription}
              loading={loading}
            >
              Manage Subscription
            </Button>
          )
        ) : isFree ? (
          <Button variant="secondary" size="large" className="w-full" disabled>
            Free Forever
          </Button>
        ) : (
          <Button
            variant={isPro ? 'primary' : 'secondary'}
            size="large"
            className="w-full"
            onClick={handleSubscribe}
            loading={loading}
          >
            {isSignedIn ? `Upgrade to ${tier.name}` : 'Sign in to Subscribe'}
          </Button>
        )}
      </div>
    </Card>
  )
}
