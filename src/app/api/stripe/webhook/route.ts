import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // User completed checkout - activate Pro
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string

        if (customerId) {
          await db
            .update(users)
            .set({ isProUser: 1 })
            .where(eq(users.stripeCustomerId, customerId))

          console.log('Pro activated for customer:', customerId)
        }
        break
      }

      // Subscription canceled - deactivate Pro
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await db
          .update(users)
          .set({ isProUser: 0 })
          .where(eq(users.stripeCustomerId, customerId))

        console.log('Pro deactivated for customer:', customerId)
        break
      }

      // Payment failed - could notify user (optional)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed for customer:', invoice.customer)
        break
      }

      default:
        console.log('Unhandled event:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
