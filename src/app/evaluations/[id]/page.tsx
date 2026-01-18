import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { db, evaluations, projects } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { ScoreBreakdown } from '@/components/ScoreBreakdown'
import { RecommendationBadge } from '@/components/RecommendationBadge'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EvaluationDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get evaluation
  const evaluation = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.id, id))
    .limit(1)
    .then(rows => rows[0])

  if (!evaluation) {
    notFound()
  }

  // Get project
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, evaluation.projectId))
    .limit(1)
    .then(rows => rows[0])

  return (
    <div className="p-4">
      {/* Header */}
      <header className="mb-6">
        <Link
          href={`/projects/${evaluation.projectId}`}
          className="text-primary font-medium mb-2 flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {project?.name}
        </Link>
        <h1 className="text-heading font-bold text-gray-900">Evaluation</h1>
        <p className="text-body text-gray-600">
          {new Date(evaluation.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </header>

      {/* Recommendation Badge */}
      {evaluation.recommendation && (
        <div className="mb-6">
          <RecommendationBadge recommendation={evaluation.recommendation} size="large" />
        </div>
      )}

      {/* Overall Score */}
      {evaluation.overallScore && (
        <div className="bg-white rounded-xl p-6 mb-6 text-center shadow-sm">
          <div className={`text-5xl font-bold ${
            Number(evaluation.overallScore) >= 7 ? 'text-success' :
            Number(evaluation.overallScore) >= 5 ? 'text-warning' : 'text-danger'
          }`}>
            {Number(evaluation.overallScore).toFixed(1)}
          </div>
          <div className="text-label text-gray-500 mt-1">Overall Score (out of 10)</div>
        </div>
      )}

      {/* Score Breakdown */}
      <ScoreBreakdown evaluation={evaluation} />
    </div>
  )
}
