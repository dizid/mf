// Run with: npx tsx scripts/setup-stripe-products.ts
// Creates Stripe products and prices for App Rater tiers

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-18.acacia',
})

async function main() {
  console.log('Creating App Rater products in Stripe...\n')

  // Create Pro product ($9/month)
  const proProduct = await stripe.products.create({
    name: 'App Rater Pro',
    description: 'Up to 25 projects, unlimited evaluations, compare up to 5 projects',
    metadata: {
      app: 'app-rater',
      tier: 'pro',
    },
  })
  console.log('✓ Created Pro product:', proProduct.id)

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 900, // $9.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      app: 'app-rater',
      tier: 'pro',
    },
  })
  console.log('✓ Created Pro price:', proPrice.id)

  // Create Team product ($29/month)
  const teamProduct = await stripe.products.create({
    name: 'App Rater Team',
    description: 'Unlimited projects, unlimited evaluations, compare up to 10 projects, API access',
    metadata: {
      app: 'app-rater',
      tier: 'team',
    },
  })
  console.log('✓ Created Team product:', teamProduct.id)

  const teamPrice = await stripe.prices.create({
    product: teamProduct.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      app: 'app-rater',
      tier: 'team',
    },
  })
  console.log('✓ Created Team price:', teamPrice.id)

  // Output env vars to add
  console.log('\n' + '='.repeat(50))
  console.log('Add these to your .env.local:\n')
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`)
  console.log(`STRIPE_TEAM_PRICE_ID=${teamPrice.id}`)
  console.log('='.repeat(50))
}

main().catch(console.error)
