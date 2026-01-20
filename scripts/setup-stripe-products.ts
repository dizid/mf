// Run with: npx tsx scripts/setup-stripe-products.ts
// Creates Stripe product and price for App Rater Pro tier

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

async function main() {
  console.log('Creating App Rater Pro product in Stripe...\n')

  // Create Pro product ($9/month)
  const proProduct = await stripe.products.create({
    name: 'App Rater Pro',
    description: 'Up to 25 projects, unlimited evaluations, compare up to 10 projects',
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

  // Output env vars to add
  console.log('\n' + '='.repeat(50))
  console.log('Add this to your .env.local:\n')
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`)
  console.log('='.repeat(50))
}

main().catch(console.error)
