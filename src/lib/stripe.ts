import Stripe from 'stripe'

// Server-side Stripe client (lazy initialization)
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

// Simple tier definitions: Free vs Pro
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
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
    limits: {
      projects: 25,
      evaluationsPerProject: Infinity,
      compareProjects: 10,
    },
    features: [
      'Up to 25 projects',
      'Unlimited evaluations',
      'Compare up to 10 projects',
      'Export to CSV',
      'Priority support',
    ],
  },
} as const

export type TierName = keyof typeof TIERS
export type Tier = typeof TIERS[TierName]
