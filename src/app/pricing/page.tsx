import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { TIERS, TierName } from '@/lib/stripe'
import { getUserLimits } from '@/lib/limits'
import { Card } from '@/components/ui/Card'
import { PricingCard } from '@/components/PricingCard'
import { PricingPageClient } from '@/components/PricingPageClient'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const session = await auth()
  let currentTier: TierName = 'free'

  if (session?.user?.id) {
    const limits = await getUserLimits(session.user.id)
    currentTier = limits.tier
  }

  return (
    <div className="p-4 pb-24">
      <Suspense fallback={null}>
        <PricingPageClient />
      </Suspense>

      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-heading font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h1>
        <p className="text-body text-gray-600">
          Start free, upgrade when you need more
        </p>
      </header>

      {/* Pricing Cards */}
      <div className="space-y-4">
        {(Object.entries(TIERS) as [TierName, typeof TIERS[TierName]][]).map(
          ([tierKey, tier]) => (
            <PricingCard
              key={tierKey}
              tierKey={tierKey}
              tier={tier}
              isCurrentTier={currentTier === tierKey}
              isSignedIn={!!session?.user}
            />
          )
        )}
      </div>

      {/* FAQ Section */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <Card>
            <h3 className="font-medium text-gray-900 mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-body text-gray-600">
              Yes! You can cancel your subscription at any time. You&apos;ll keep access until the end of your billing period.
            </p>
          </Card>

          <Card>
            <h3 className="font-medium text-gray-900 mb-2">
              What happens to my data if I downgrade?
            </h3>
            <p className="text-body text-gray-600">
              Your data is never deleted. If you exceed limits after downgrading, you won&apos;t be able to create new items until you&apos;re under the limit.
            </p>
          </Card>

          <Card>
            <h3 className="font-medium text-gray-900 mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-body text-gray-600">
              We offer a 14-day money-back guarantee. Contact us if you&apos;re not satisfied.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}
