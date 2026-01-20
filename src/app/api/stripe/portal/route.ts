import { NextResponse } from 'next/server'
import { isAuthenticated, getDefaultUserId } from '@/lib/password-auth'
import { getStripe } from '@/lib/stripe'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({
      error: { code: 'UNAUTHORIZED', message: 'Sign in required' }
    }, { status: 401 })
  }

  try {
    const userId = await getDefaultUserId()
    const stripe = getStripe()

    // Get user from DB
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0])

    if (!user?.stripeCustomerId) {
      return NextResponse.json({
        error: { code: 'NOT_FOUND', message: 'No subscription found' }
      }, { status: 404 })
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json({
      error: { code: 'SERVER_ERROR', message: 'Failed to open portal' }
    }, { status: 500 })
  }
}
