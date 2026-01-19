import Link from 'next/link'
import { db, projects, evaluations } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { getDefaultUserId } from '@/lib/password-auth'
import { RecommendationBadge } from '@/components/RecommendationBadge'
import { recommendationInfo, metricDefinitions, type MetricKey } from '@/lib/scoring'
import type { Recommendation, Evaluation } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

// Map database fields to metric keys
const fieldToKey: Record<string, MetricKey> = {
  scoreUsability: 'usability',
  scoreValue: 'value',
  scoreFeatures: 'features',
  scorePolish: 'polish',
  scoreCompetition: 'competition',
  scoreMarket: 'market',
  scoreMonetization: 'monetization',
  scoreMaintenance: 'maintenance',
  scoreGrowth: 'growth',
  scorePassion: 'passion',
  scoreLearning: 'learning',
  scorePride: 'pride',
}

interface ActionItem {
  type: 'rate' | 'stale' | 'drop'
  priority: 'high' | 'medium'
  projectId: string
  projectName: string
  message: string
  href: string
}

function computeActionItems(
  projectsWithEvals: Array<{ id: string; name: string; evaluation?: Evaluation }>
): ActionItem[] {
  const items: ActionItem[] = []
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  for (const project of projectsWithEvals) {
    // Unrated projects
    if (!project.evaluation) {
      items.push({
        type: 'rate',
        priority: 'high',
        projectId: project.id,
        projectName: project.name,
        message: 'Needs initial rating',
        href: `/projects/${project.id}/rate`,
      })
      continue
    }

    // Drop candidates
    if (project.evaluation.recommendation === 'drop') {
      items.push({
        type: 'drop',
        priority: 'high',
        projectId: project.id,
        projectName: project.name,
        message: 'Consider archiving',
        href: `/projects/${project.id}`,
      })
    }

    // Stale projects (not evaluated in 30+ days)
    const evalDate = new Date(project.evaluation.createdAt)
    if (evalDate < thirtyDaysAgo) {
      const daysAgo = Math.floor((Date.now() - evalDate.getTime()) / (1000 * 60 * 60 * 24))
      items.push({
        type: 'stale',
        priority: 'medium',
        projectId: project.id,
        projectName: project.name,
        message: `Last rated ${daysAgo} days ago`,
        href: `/projects/${project.id}/rate`,
      })
    }
  }

  // Sort: high priority first
  items.sort((a, b) => (a.priority === 'high' ? -1 : 1) - (b.priority === 'high' ? -1 : 1))

  return items.slice(0, 5)
}

interface MetricAverage {
  key: MetricKey
  label: string
  avgScore: number
}

function computeWeakestMetrics(
  projectsWithEvals: Array<{ evaluation?: Evaluation }>
): MetricAverage[] {
  const metricSums: Record<string, { sum: number; count: number }> = {}

  for (const project of projectsWithEvals) {
    if (!project.evaluation) continue

    for (const [field, key] of Object.entries(fieldToKey)) {
      const score = project.evaluation[field as keyof Evaluation] as number | null
      if (score === null || score === undefined) continue

      // For maintenance, invert score (high maintenance = bad)
      const adjustedScore = key === 'maintenance' ? 10 - score : score

      if (!metricSums[key]) {
        metricSums[key] = { sum: 0, count: 0 }
      }
      metricSums[key].sum += adjustedScore
      metricSums[key].count++
    }
  }

  const averages: MetricAverage[] = []
  for (const [key, data] of Object.entries(metricSums)) {
    if (data.count === 0) continue
    const def = metricDefinitions[key as MetricKey]
    averages.push({
      key: key as MetricKey,
      label: def.label,
      avgScore: data.sum / data.count,
    })
  }

  // Sort by average score ascending (weakest first)
  averages.sort((a, b) => a.avgScore - b.avgScore)

  return averages.slice(0, 3)
}

function computeCategoryAverages(
  projectsWithEvals: Array<{ evaluation?: Evaluation }>
): { product: number | null; business: number | null; personal: number | null } {
  let productSum = 0, productCount = 0
  let businessSum = 0, businessCount = 0
  let personalSum = 0, personalCount = 0

  for (const project of projectsWithEvals) {
    if (!project.evaluation) continue
    if (project.evaluation.productScore) {
      productSum += Number(project.evaluation.productScore)
      productCount++
    }
    if (project.evaluation.businessScore) {
      businessSum += Number(project.evaluation.businessScore)
      businessCount++
    }
    if (project.evaluation.personalScore) {
      personalSum += Number(project.evaluation.personalScore)
      personalCount++
    }
  }

  return {
    product: productCount > 0 ? productSum / productCount : null,
    business: businessCount > 0 ? businessSum / businessCount : null,
    personal: personalCount > 0 ? personalSum / personalCount : null,
  }
}

function getScoreColor(score: number | null): string {
  if (!score) return 'text-gray-400'
  if (score >= 7) return 'text-success'
  if (score >= 5) return 'text-warning'
  return 'text-danger'
}

export default async function HomePage() {
  const userId = await getDefaultUserId()

  // Get all projects with their latest evaluation
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.updatedAt))

  // Get latest evaluation for each project
  const projectsWithEvals = await Promise.all(
    userProjects.map(async (project) => {
      const latestEval = await db
        .select()
        .from(evaluations)
        .where(eq(evaluations.projectId, project.id))
        .orderBy(desc(evaluations.createdAt))
        .limit(1)
        .then(rows => rows[0])

      return {
        ...project,
        evaluation: latestEval,
      }
    })
  )

  // Count by recommendation
  const recommendationCounts = projectsWithEvals.reduce((acc, p) => {
    const rec = p.evaluation?.recommendation as Recommendation | undefined
    if (rec) {
      acc[rec] = (acc[rec] || 0) + 1
    } else {
      acc.unrated = (acc.unrated || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Calculate stats
  const ratedProjects = projectsWithEvals.filter(p => p.evaluation?.overallScore)
  const avgScore = ratedProjects.length > 0
    ? ratedProjects.reduce((sum, p) => sum + Number(p.evaluation!.overallScore), 0) / ratedProjects.length
    : null

  // Compute insights
  const actionItems = computeActionItems(projectsWithEvals)
  const weakestMetrics = computeWeakestMetrics(projectsWithEvals)
  const categoryAverages = computeCategoryAverages(projectsWithEvals)
  const hasRatedProjects = ratedProjects.length > 0

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-heading font-bold text-gray-900">Portfolio</h1>
        <p className="text-body text-gray-600">{userProjects.length} apps tracked</p>
      </header>

      {/* Portfolio Summary by Recommendation */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Portfolio Breakdown</h2>
        <div className="grid grid-cols-3 gap-2">
          {(['invest', 'keep', 'pivot', 'pause', 'drop'] as Recommendation[]).map((rec) => {
            const count = recommendationCounts[rec] || 0
            const info = recommendationInfo[rec]
            return (
              <div
                key={rec}
                className={`${info.bgColor} rounded-lg p-3 text-center`}
              >
                <div className="text-xl">{info.emoji}</div>
                <div className={`text-2xl font-bold ${info.color}`}>{count}</div>
                <div className="text-xs text-gray-600">{info.label}</div>
              </div>
            )
          })}
          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <div className="text-xl">❓</div>
            <div className="text-2xl font-bold text-gray-700">{recommendationCounts.unrated || 0}</div>
            <div className="text-xs text-gray-600">UNRATED</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-3xl font-bold text-primary">{userProjects.length}</div>
          <div className="text-label text-gray-500">Total Apps</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className={`text-3xl font-bold ${
            avgScore && avgScore >= 7 ? 'text-success' :
            avgScore && avgScore >= 5 ? 'text-warning' :
            avgScore ? 'text-danger' : 'text-gray-400'
          }`}>
            {avgScore ? avgScore.toFixed(1) : '-'}
          </div>
          <div className="text-label text-gray-500">Avg Score</div>
        </div>
      </div>

      {/* Category Averages - Only show if there are rated projects */}
      {hasRatedProjects && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Category Averages</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-2xl font-bold ${getScoreColor(categoryAverages.product)}`}>
                {categoryAverages.product?.toFixed(1) || '-'}
              </div>
              <div className="text-label text-gray-500">Product</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getScoreColor(categoryAverages.business)}`}>
                {categoryAverages.business?.toFixed(1) || '-'}
              </div>
              <div className="text-label text-gray-500">Business</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getScoreColor(categoryAverages.personal)}`}>
                {categoryAverages.personal?.toFixed(1) || '-'}
              </div>
              <div className="text-label text-gray-500">Personal</div>
            </div>
          </div>
        </div>
      )}

      {/* Weakest Metrics - Only show if there are weak areas */}
      {weakestMetrics.length > 0 && weakestMetrics[0].avgScore < 6 && (
        <div className="bg-orange-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Areas to Focus On
          </h3>
          <div className="space-y-2">
            {weakestMetrics.map((metric) => (
              <div key={metric.key} className="flex justify-between items-center">
                <span className="text-sm text-orange-700">{metric.label}</span>
                <span className={`text-sm font-semibold ${getScoreColor(metric.avgScore)}`}>
                  {metric.avgScore.toFixed(1)} avg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items - Enhanced with direct links */}
      {actionItems.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-3">Action Items</h3>
          <div className="space-y-2">
            {actionItems.map((item) => (
              <Link
                key={`${item.type}-${item.projectId}`}
                href={item.href}
                className="flex items-center gap-3 p-2 bg-white rounded-lg active:bg-gray-50"
              >
                {/* Priority indicator */}
                <div className={`w-2 h-2 rounded-full ${
                  item.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                {/* Icon */}
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  {item.type === 'rate' && (
                    <svg className="w-4 h-4 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                  {item.type === 'drop' && (
                    <svg className="w-4 h-4 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  {item.type === 'stale' && (
                    <svg className="w-4 h-4 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{item.projectName}</div>
                  <div className="text-xs text-gray-500">{item.message}</div>
                </div>
                {/* Arrow */}
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent</h2>
          <Link href="/projects" className="text-primary font-medium text-label">
            View All
          </Link>
        </div>

        {projectsWithEvals.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-body text-gray-500 mb-4">No apps yet</p>
            <Link
              href="/projects/new"
              className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl"
            >
              Add Your First App
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projectsWithEvals.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  {/* Score */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                    project.evaluation?.overallScore
                      ? Number(project.evaluation.overallScore) >= 7
                        ? 'bg-green-50 text-success'
                        : Number(project.evaluation.overallScore) >= 5
                          ? 'bg-yellow-50 text-warning'
                          : 'bg-red-50 text-danger'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {project.evaluation?.overallScore
                      ? Number(project.evaluation.overallScore).toFixed(1)
                      : '?'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                      {project.evaluation?.recommendation && (
                        <RecommendationBadge
                          recommendation={project.evaluation.recommendation}
                          size="small"
                        />
                      )}
                    </div>
                    <p className="text-label text-gray-500 truncate">
                      {project.url.replace(/^https?:\/\//, '')}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FAB - Add Project */}
      <Link
        href="/projects/new"
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-white text-2xl font-light active:bg-primary-dark"
        aria-label="Add new project"
      >
        +
      </Link>
    </div>
  )
}
