# App Rater

**Live:** https://mf-dizid.netlify.app/

A portfolio evaluation tool for indie developers and makers. Rate your side projects with manual scoring or AI-powered analysis, compare them side-by-side, and get data-driven recommendations on where to invest your time.

## Features

- **Manual Scoring** — Rate projects across 12 metrics: usability, value proposition, features, polish, competition, market size, monetization, maintenance burden, growth potential, passion, learning value, and pride
- **AI-Powered Evaluation** — Automatically scores projects by scraping your website, running PageSpeed analysis, and evaluating with AI
- **Portfolio Dashboard** — Overview of all projects with category breakdowns, weakest metrics, and action items
- **Project Comparison** — Side-by-side comparison with score breakdown charts
- **Batch Evaluation** — Evaluate multiple projects in one flow
- **Weighted Recommendations** — Auto-generated invest/keep/pivot/pause/drop recommendations based on composite scores (50% product, 30% business, 20% personal)
- **Subscription Tiers** — Free tier (3 projects) and Pro tier ($9/mo, 25 projects) via Stripe

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **AI**: xAI (Grok) for evaluations
- **Scraping**: Firecrawl for website content extraction
- **Performance**: Google PageSpeed Insights API
- **Payments**: Stripe (checkout, webhooks, subscriptions)
- **Charts**: Recharts
- **Testing**: Vitest + Testing Library (unit), Playwright (E2E)
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon PostgreSQL database
- API keys for xAI, Stripe, and optionally Google PageSpeed

### Install

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```bash
# Database
DATABASE_URL=postgresql://...@...neon.tech/...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=           # openssl rand -base64 32
APP_PASSWORD=              # your login password

# AI
XAI_API_KEY=               # xAI (Grok) API key

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

# Optional
PAGESPEED_API_KEY=         # increases Google PageSpeed quota
```

### Database Setup

```bash
npm run db:push            # apply schema to database
npm run db:studio          # open Drizzle Studio (DB explorer)
```

### Development

```bash
npm run dev                # http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Unit tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Apply schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── api/               # API routes (ai-evaluate, evaluate, projects, stripe, auth, limits)
│   ├── projects/          # Project pages (list, detail, new, AI evaluate, batch)
│   ├── evaluations/       # Evaluation detail view
│   ├── compare/           # Side-by-side comparison
│   ├── pricing/           # Subscription pricing
│   ├── login/             # Authentication
│   └── page.tsx           # Dashboard
├── components/            # React components (UI primitives, score cards, charts)
├── hooks/                 # Custom hooks (batch evaluation)
└── lib/                   # Business logic
    ├── db/                # Drizzle schema & connection
    ├── ai/                # AI evaluator, prompts, scraper
    ├── scoring.ts         # Score calculation & recommendations
    ├── stripe.ts          # Stripe client & tier config
    ├── limits.ts          # Usage limits enforcement
    ├── password-auth.ts   # Cookie-based authentication
    └── validations/       # Zod schemas
```

## Deployment

Deployed on Netlify with `@netlify/plugin-nextjs`. Build command: `npm run build`. Node 20.
