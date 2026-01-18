import Link from 'next/link'
import { db, projects, evaluations } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { RecommendationBadge } from '@/components/RecommendationBadge'
import { recommendationInfo } from '@/lib/scoring'
import { LandingPage } from '@/components/LandingPage'
import type { Recommendation } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()

  // Show landing page for non-authenticated users
  if (!session?.user) {
    return <LandingPage />
  }

  // Get all projects with their latest evaluation
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, session.user.id))
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

  // Find action items
  const needsRating = projectsWithEvals.filter(p => !p.evaluation).length
  const dropCandidates = recommendationCounts.drop || 0

  return (
    <div className="p-4">
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

      {/* Action Items */}
      {(needsRating > 0 || dropCandidates > 0) && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Action Items</h3>
          <ul className="space-y-1 text-sm text-yellow-700">
            {needsRating > 0 && (
              <li>• {needsRating} app{needsRating > 1 ? 's' : ''} need rating</li>
            )}
            {dropCandidates > 0 && (
              <li>• {dropCandidates} app{dropCandidates > 1 ? 's' : ''} recommended to drop</li>
            )}
          </ul>
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
