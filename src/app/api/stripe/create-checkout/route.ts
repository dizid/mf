import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated, getDefaultUserId } from '@/lib/password-auth'
import { stripe, TIERS, TierName, getOrCreateStripeCustomer } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be signed in to subscribe',
      }
    }, { status: 401 })
  }

  try {
    const userId = await getDefaultUserId()
    const { tier } = await req.json() as { tier: TierName }

    if (!tier || !TIERS[tier] || tier === 'free') {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid subscription tier',
        }
      }, { status: 400 })
    }

    const tierConfig = TIERS[tier]
    if (!tierConfig.priceId) {
      return NextResponse.json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Price not configured for this tier',
        }
      }, { status: 500 })
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      userId,
      'owner@apprater.local',
      'App Owner'
    )

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/pricing?success=true`,
      cancel_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      metadata: {
        userId,
        tier,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create checkout session',
      }
    }, { status: 500 })
  }
}
