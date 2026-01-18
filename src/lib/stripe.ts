import Stripe from 'stripe'

// Server-side Stripe client (lazy initialization to handle build time)
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// For backwards compatibility - use getStripe() for new code
export const stripe = {
  get customers() { return getStripe().customers },
  get subscriptions() { return getStripe().subscriptions },
  get checkout() { return getStripe().checkout },
  get billingPortal() { return getStripe().billingPortal },
  get webhooks() { return getStripe().webhooks },
}

// Subscription tier definitions
export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    limits: {
      projects: 3,
      evaluationsPerProject: 5,
      compareProjects: 2,
    },
    features: [
      'Up to 3 projects',
      '5 evaluations per project',
      'Compare 2 projects',
      'Basic recommendations',
    ],
  },
  pro: {
    name: 'Pro',
    price: 9,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: {
      projects: 25,
      evaluationsPerProject: Infinity,
      compareProjects: 5,
    },
    features: [
      'Up to 25 projects',
      'Unlimited evaluations',
      'Compare up to 5 projects',
      'Export to CSV',
      'Priority support',
    ],
  },
  team: {
    name: 'Team',
    price: 29,
    priceId: process.env.STRIPE_TEAM_PRICE_ID,
    limits: {
      projects: Infinity,
      evaluationsPerProject: Infinity,
      compareProjects: 10,
    },
    features: [
      'Unlimited projects',
      'Unlimited evaluations',
      'Compare up to 10 projects',
      'Export to CSV & JSON',
      'API access',
      'Up to 5 team members',
    ],
  },
} as const

export type TierName = keyof typeof TIERS
export type Tier = typeof TIERS[TierName]

// Get user's subscription tier from Stripe
export async function getUserTier(stripeCustomerId: string | null): Promise<TierName> {
  if (!stripeCustomerId) return 'free'

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) return 'free'

    const subscription = subscriptions.data[0]
    const priceId = subscription.items.data[0]?.price.id

    if (priceId === TIERS.team.priceId) return 'team'
    if (priceId === TIERS.pro.priceId) return 'pro'

    return 'free'
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return 'free'
  }
}

// Create or get Stripe customer for user
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  // Search for existing customer by metadata
  const existingCustomers = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  })

  return customer.id
}
