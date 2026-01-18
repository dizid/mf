import { notFound, redirect } from 'next/navigation'
import { db, projects } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { RatingForm } from '@/components/RatingForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RateProjectPage({ params }: Props) {
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

  return (
    <RatingForm
      projectId={id}
      projectName={project.name}
    />
  )
}
