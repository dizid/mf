import { notFound } from 'next/navigation'
import { db, projects } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { AIEvaluationFlow } from '@/components/AIEvaluationFlow'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AIEvaluatePage({ params }: Props) {
  const { id } = await params

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

  return (
    <AIEvaluationFlow
      projectId={id}
      projectName={project.name}
    />
  )
}
