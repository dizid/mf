import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { db, projects, evaluations } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { ScoreBreakdown } from '@/components/ScoreBreakdown'
import { RecommendationBadge } from '@/components/RecommendationBadge'
import { Button } from '@/components/ui/Button'
import { ScoreDelta } from '@/components/ScoreDelta'
import { ImprovementSuggestions } from '@/components/ImprovementSuggestions'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get project
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1)
    .then(rows => rows[0])

  if (!project) {
    notFound()
  }

  // Get evaluations history
  const evalHistory = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.projectId, id))
    .orderBy(desc(evaluations.createdAt))
    .limit(10)

  const latestEval = evalHistory[0]
  const previousEval = evalHistory[1] // For showing score delta
  const hasEvaluation = !!latestEval

  return (
    <div className="p-4">
      {/* Header */}
      <header className="mb-6">
        <Link
          href="/projects"
          className="text-primary font-medium mb-2 flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Projects
        </Link>
        <h1 className="text-heading font-bold text-gray-900">{project.name}</h1>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body text-primary underline"
        >
          {project.url.replace(/^https?:\/\//, '')}
        </a>
        {project.category && (
          <div className="mt-1 text-label text-gray-500">{project.category}</div>
        )}
      </header>

      {/* Recommendation Badge (large) */}
      {latestEval?.recommendation && (
        <div className="mb-6">
          <RecommendationBadge recommendation={latestEval.recommendation} size="large" />
        </div>
      )}

      {/* Overall Score */}
      {latestEval?.overallScore && (
        <div className="bg-white rounded-xl p-6 mb-6 text-center shadow-sm">
          <div className="flex items-center justify-center gap-3">
            <div className={`text-5xl font-bold ${
              Number(latestEval.overallScore) >= 7 ? 'text-success' :
              Number(latestEval.overallScore) >= 5 ? 'text-warning' : 'text-danger'
            }`}>
              {Number(latestEval.overallScore).toFixed(1)}
            </div>
            <ScoreDelta
              current={Number(latestEval.overallScore)}
              previous={previousEval?.overallScore ? Number(previousEval.overallScore) : null}
              size="large"
            />
          </div>
          <div className="text-label text-gray-500 mt-1">Overall Score (out of 10)</div>
        </div>
      )}

      {/* Rate Button */}
      <div className="mb-6">
        <Link href={`/projects/${id}/rate`}>
          <Button size="large" className="w-full">
            {hasEvaluation ? 'Re-evaluate' : 'Rate This App'}
          </Button>
        </Link>
      </div>

      {/* Score Breakdown */}
      {latestEval && <ScoreBreakdown evaluation={latestEval} />}

      {/* Improvement Suggestions */}
      {latestEval && <ImprovementSuggestions evaluation={latestEval} />}

      {/* No evaluation message */}
      {!hasEvaluation && (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-body text-gray-500 mb-2">No evaluation yet</p>
          <p className="text-label text-gray-400">
            Rate this app to see scores and get a recommendation
          </p>
        </div>
      )}

      {/* History */}
      {evalHistory.length > 1 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
          <div className="space-y-2">
            {evalHistory.slice(1).map((ev) => (
              <Link
                key={ev.id}
                href={`/evaluations/${ev.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-label text-gray-500">
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </span>
                    {ev.recommendation && (
                      <span className="ml-2">
                        <RecommendationBadge recommendation={ev.recommendation} size="small" />
                      </span>
                    )}
                  </div>
                  <span className={`font-bold ${
                    Number(ev.overallScore) >= 7 ? 'text-success' :
                    Number(ev.overallScore) >= 5 ? 'text-warning' : 'text-danger'
                  }`}>
                    {ev.overallScore ? Number(ev.overallScore).toFixed(1) : '-'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
