import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, projects, evaluations } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { createProjectSchema, formatZodErrors } from '@/lib/validations'
import { canCreateProject, getUpgradeMessage } from '@/lib/limits'

// GET /api/projects - List all projects for the current user with latest evaluation
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, session.user.id))
    .orderBy(desc(projects.updatedAt))

  // Fetch latest evaluation for each project
  const projectsWithEvals = await Promise.all(
    userProjects.map(async (project) => {
      const latestEval = await db
        .select({
          overallScore: evaluations.overallScore,
          productScore: evaluations.productScore,
          businessScore: evaluations.businessScore,
          personalScore: evaluations.personalScore,
          recommendation: evaluations.recommendation,
        })
        .from(evaluations)
        .where(eq(evaluations.projectId, project.id))
        .orderBy(desc(evaluations.createdAt))
        .limit(1)
        .then(rows => rows[0])

      return {
        ...project,
        evaluation: latestEval || null,
      }
    })
  )

  return NextResponse.json(projectsWithEvals)
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be signed in to create a project',
      }
    }, { status: 401 })
  }

  try {
    // Check if user can create more projects
    const canCreate = await canCreateProject(session.user.id)
    if (!canCreate) {
      return NextResponse.json({
        error: {
          code: 'FORBIDDEN',
          message: getUpgradeMessage('projects'),
          upgradeRequired: true,
        }
      }, { status: 403 })
    }

    const body = await req.json()

    // Validate input
    const result = createProjectSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: formatZodErrors(result.error),
        }
      }, { status: 400 })
    }

    const { name, url, description } = result.data

    const [project] = await db
      .insert(projects)
      .values({
        name,
        url,
        description: description || null,
        ownerId: session.user.id,
      })
      .returning()

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create project. Please try again.',
      }
    }, { status: 500 })
  }
}
