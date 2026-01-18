import { db, projects, evaluations } from '@/lib/db'
import { eq, count } from 'drizzle-orm'
import { TIERS, TierName, getUserTier, stripe } from './stripe'

export interface UsageLimits {
  tier: TierName
  projects: {
    used: number
    limit: number
    remaining: number
    canCreate: boolean
  }
  evaluations: {
    limitPerProject: number
  }
  compare: {
    limit: number
  }
}

// Get user's current usage and limits
export async function getUserLimits(userId: string): Promise<UsageLimits> {
  // Get Stripe customer ID from Stripe (using metadata search)
  let stripeCustomerId: string | null = null
  try {
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    })
    stripeCustomerId = customers.data[0]?.id || null
  } catch {
    // Stripe not configured or error - default to free
  }

  // Get user's tier
  const tier = await getUserTier(stripeCustomerId)
  const tierConfig = TIERS[tier]

  // Count user's projects
  const [projectCount] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.ownerId, userId))

  const projectsUsed = projectCount?.count || 0
  const projectsLimit = tierConfig.limits.projects
  const projectsRemaining = Math.max(0, projectsLimit - projectsUsed)

  return {
    tier,
    projects: {
      used: projectsUsed,
      limit: projectsLimit,
      remaining: projectsRemaining,
      canCreate: projectsUsed < projectsLimit,
    },
    evaluations: {
      limitPerProject: tierConfig.limits.evaluationsPerProject,
    },
    compare: {
      limit: tierConfig.limits.compareProjects,
    },
  }
}

// Check if user can create a new project
export async function canCreateProject(userId: string): Promise<boolean> {
  const limits = await getUserLimits(userId)
  return limits.projects.canCreate
}

// Check if user can create another evaluation for a project
export async function canCreateEvaluation(
  userId: string,
  projectId: string
): Promise<boolean> {
  const limits = await getUserLimits(userId)

  if (limits.evaluations.limitPerProject === Infinity) return true

  // Count evaluations for this project
  const [evalCount] = await db
    .select({ count: count() })
    .from(evaluations)
    .where(eq(evaluations.projectId, projectId))

  return (evalCount?.count || 0) < limits.evaluations.limitPerProject
}

// Get upgrade message based on what limit was hit
export function getUpgradeMessage(limitType: 'projects' | 'evaluations' | 'compare'): string {
  const messages = {
    projects: 'You\'ve reached your project limit. Upgrade to Pro for up to 25 projects.',
    evaluations: 'You\'ve reached your evaluation limit for this project. Upgrade for unlimited evaluations.',
    compare: 'Upgrade to compare more projects side by side.',
  }
  return messages[limitType]
}
