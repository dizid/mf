import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated, getDefaultUserId } from '@/lib/password-auth'
import { getStripe, TIERS } from '@/lib/stripe'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({
      error: { code: 'UNAUTHORIZED', message: 'Sign in required' }
    }, { status: 401 })
  }

  try {
    const userId = await getDefaultUserId()
    const stripe = getStripe()

    // Check if Pro price is configured
    const priceId = TIERS.pro.priceId
    if (!priceId) {
      return NextResponse.json({
        error: { code: 'CONFIG_ERROR', message: 'STRIPE_PRO_PRICE_ID not set' }
      }, { status: 500 })
    }

    // Get user from DB
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0])

    if (!user) {
      return NextResponse.json({
        error: { code: 'NOT_FOUND', message: 'User not found' }
      }, { status: 404 })
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      })
      customerId = customer.id

      // Save customer ID to DB
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, userId))
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/pricing?success=true`,
      cancel_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      metadata: { userId },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({
      error: { code: 'SERVER_ERROR', message: 'Failed to create checkout' }
    }, { status: 500 })
  }
}
