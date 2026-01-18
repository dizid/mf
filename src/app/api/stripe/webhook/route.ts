import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

// Disable body parsing - we need raw body for webhook verification
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Missing signature' }
    }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid signature' }
    }, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout completed:', {
          customerId: session.customer,
          subscriptionId: session.subscription,
          userId: session.metadata?.userId,
          tier: session.metadata?.tier,
        })
        // Subscription is automatically active after checkout
        // No additional action needed since we query Stripe directly
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', {
          id: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
        })
        // We query Stripe directly for subscription status
        // so no additional action needed
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription canceled:', {
          id: subscription.id,
          customerId: subscription.customer,
        })
        // User will automatically fall back to free tier
        // since we query Stripe directly
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          attemptCount: invoice.attempt_count,
        })
        // Stripe handles retry logic automatically
        // Consider sending email notification to user
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({
      error: { code: 'SERVER_ERROR', message: 'Webhook handler failed' }
    }, { status: 500 })
  }
}
