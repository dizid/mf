# App Rater - TODO

## Ready to Ship
- [x] Compare page - real scores
- [x] Input validation (zod)
- [x] Error pages
- [x] Stripe monetization
- [x] Pricing page
- [x] Landing page
- [x] Toast notifications

## Optional Improvements
- [ ] Testing (vitest, playwright)
- [ ] Analytics (Posthog/Plausible)
- [ ] Email notifications (Resend)
- [ ] PWA support

## Stripe Setup

### 1. Create Products in Stripe Dashboard
Go to **Products** → **Add Product**:
- **Pro**: $9/month recurring
- **Team**: $29/month recurring

### 2. Get Price IDs
After creating products, copy the `price_xxx` IDs from each product's pricing section.

### 3. Create Webhook
Go to **Developers** → **Webhooks** → **Add endpoint**:
- URL: `https://yourapp.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 4. Environment Variables
```bash
STRIPE_SECRET_KEY=sk_live_xxx        # Dashboard → Developers → API keys
STRIPE_WEBHOOK_SECRET=whsec_xxx      # From webhook endpoint page
STRIPE_PRO_PRICE_ID=price_xxx        # From Pro product
STRIPE_TEAM_PRICE_ID=price_xxx       # From Team product
```

### 5. Test Mode
Use `sk_test_xxx` keys first. Test cards: `4242424242424242`
