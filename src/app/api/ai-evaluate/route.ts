import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/password-auth'
import { db, projects } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { runAIEvaluation } from '@/lib/ai/ai-evaluator'
import { z } from 'zod'

const requestSchema = z.object({
  projectId: z.string().uuid(),
})

// POST /api/ai-evaluate - Run AI evaluation on a project
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be signed in to run AI evaluation',
      }
    }, { status: 401 })
  }

  // Check for API key
  if (!process.env.XAI_API_KEY) {
    return NextResponse.json({
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'AI evaluation is not configured. Please set XAI_API_KEY.',
      }
    }, { status: 500 })
  }

  try {
    const body = await req.json()

    // Validate input
    const result = requestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: result.error.flatten().fieldErrors,
        }
      }, { status: 400 })
    }

    const { projectId } = result.data

    // Get project
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .then(rows => rows[0])

    if (!project) {
      return NextResponse.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
        }
      }, { status: 404 })
    }

    // Run AI evaluation
    const evaluation = await runAIEvaluation(project)

    if (!evaluation.success) {
      return NextResponse.json({
        error: {
          code: 'AI_EVALUATION_FAILED',
          message: evaluation.error || 'AI evaluation failed',
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      scores: evaluation.scores,
      reasoning: evaluation.reasoning,
      firstImpressions: evaluation.firstImpressions,
      recommendations: evaluation.recommendations,
      pageSpeedData: evaluation.pageSpeedData,
      tokenUsage: evaluation.tokenUsage,
    })
  } catch (error) {
    console.error('Error in AI evaluation:', error)
    return NextResponse.json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to run AI evaluation. Please try again.',
      }
    }, { status: 500 })
  }
}
