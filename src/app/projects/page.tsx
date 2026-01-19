import Link from 'next/link'
import { db, projects, evaluations } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'
import { getDefaultUserId } from '@/lib/password-auth'
import { RecommendationBadge } from '@/components/RecommendationBadge'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const userId = await getDefaultUserId()

  // Get all projects
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.updatedAt))

  // Get latest evaluation for each project
  const projectsWithEvals = await Promise.all(
    userProjects.map(async (project) => {
      const latestEval = await db
        .select({
          overallScore: evaluations.overallScore,
          recommendation: evaluations.recommendation,
        })
        .from(evaluations)
        .where(eq(evaluations.projectId, project.id))
        .orderBy(desc(evaluations.createdAt))
        .limit(1)
        .then(rows => rows[0])

      return {
        ...project,
        score: latestEval?.overallScore ? Number(latestEval.overallScore) : null,
        recommendation: latestEval?.recommendation,
      }
    })
  )

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-heading font-bold text-gray-900">Projects</h1>
        <p className="text-body text-gray-600">{userProjects.length} apps registered</p>
      </header>

      {/* Projects List */}
      {projectsWithEvals.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-body text-gray-500 mb-4">No projects yet</p>
          <Link
            href="/projects/new"
            className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl"
          >
            Add Your First Project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projectsWithEvals.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                {/* Score */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                  project.score !== null
                    ? project.score >= 7
                      ? 'bg-green-50 text-success'
                      : project.score >= 5
                        ? 'bg-yellow-50 text-warning'
                        : 'bg-red-50 text-danger'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {project.score !== null ? project.score.toFixed(1) : '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    {project.recommendation && (
                      <RecommendationBadge recommendation={project.recommendation} size="small" />
                    )}
                  </div>
                  <p className="text-label text-gray-500 truncate">
                    {project.url.replace(/^https?:\/\//, '')}
                  </p>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* FAB */}
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
