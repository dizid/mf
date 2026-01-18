import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be signed in',
      }
    }, { status: 401 })
  }

  try {
    // Find customer by userId metadata
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${session.user.id}'`,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return NextResponse.json({
        error: {
          code: 'NOT_FOUND',
          message: 'No subscription found',
        }
      }, { status: 404 })
    }

    const customerId = customers.data[0].id

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/pricing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to open billing portal',
      }
    }, { status: 500 })
  }
}
