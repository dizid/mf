import { pgTable, uuid, text, timestamp, integer, decimal, jsonb } from 'drizzle-orm/pg-core'

// Users table (for NextAuth + evaluators)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  image: text('image'),
  stripeCustomerId: text('stripe_customer_id'),
  isProUser: integer('is_pro_user').default(0).notNull(), // 0 = free, 1 = pro
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// NextAuth accounts (OAuth providers)
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
})

// NextAuth sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: text('session_token').unique().notNull(),
  expires: timestamp('expires').notNull(),
})

// NextAuth verification tokens
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
})

// Competitor type for projects
export type Competitor = {
  name: string
  url: string
  notes?: string
}

// Projects to evaluate
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  category: text('category'), // e.g., "productivity", "utility", "game"
  targetAudience: text('target_audience'),
  competitors: jsonb('competitors').$type<Competitor[]>(),
  status: text('status').notNull().default('active'), // active, paused, archived
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Notes type for evaluations
export type EvaluationNotes = {
  usability?: string
  value?: string
  features?: string
  polish?: string
  competition?: string
  market?: string
  monetization?: string
  maintenance?: string
  growth?: string
  passion?: string
  learning?: string
  pride?: string
}

// Evaluation runs (versioned) - Product-focused metrics
export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  evaluatorId: uuid('evaluator_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // Product Metrics (1-10)
  scoreUsability: integer('score_usability'),    // How easy to use?
  scoreValue: integer('score_value'),            // Does it solve a real problem?
  scoreFeatures: integer('score_features'),      // Feature completeness
  scorePolish: integer('score_polish'),          // Quality & fit/finish
  scoreCompetition: integer('score_competition'), // Market positioning

  // Business Metrics (1-10)
  scoreMarket: integer('score_market'),          // Market size
  scoreMonetization: integer('score_monetization'), // Can it make money?
  scoreMaintenance: integer('score_maintenance'), // Effort to maintain (lower is better)
  scoreGrowth: integer('score_growth'),          // Growth potential

  // Personal Metrics (1-10)
  scorePassion: integer('score_passion'),        // Do you enjoy working on it?
  scoreLearning: integer('score_learning'),      // Learning value
  scorePride: integer('score_pride'),            // Portfolio worthy?

  // Notes for context
  notes: jsonb('notes').$type<EvaluationNotes>(),

  // Computed scores
  productScore: decimal('product_score', { precision: 4, scale: 2 }),
  businessScore: decimal('business_score', { precision: 4, scale: 2 }),
  personalScore: decimal('personal_score', { precision: 4, scale: 2 }),
  overallScore: decimal('overall_score', { precision: 4, scale: 2 }),

  // Auto-recommendation based on scores
  recommendation: text('recommendation'), // invest, keep, pivot, pause, drop
})

// Types for use in the app
export type User = typeof users.$inferSelect
export type Project = typeof projects.$inferSelect
export type Evaluation = typeof evaluations.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type NewEvaluation = typeof evaluations.$inferInsert

// Recommendation type
export type Recommendation = 'invest' | 'keep' | 'pivot' | 'pause' | 'drop'
