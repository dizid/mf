import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated, getDefaultUserId } from '@/lib/password-auth'
import { db, projects, evaluations, type EvaluationNotes } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { runAIEvaluation } from '@/lib/ai/ai-evaluator'
import { computeAllScores } from '@/lib/scoring'
import { z } from 'zod'

const requestSchema = z.object({
  projectId: z.string().uuid(),
})

// POST /api/ai-evaluate - Run multi-agent AI evaluation and auto-save results
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

    // Run multi-agent AI evaluation
    const aiResult = await runAIEvaluation(project)

    if (!aiResult.success || !aiResult.scores) {
      return NextResponse.json({
        error: {
          code: 'AI_EVALUATION_FAILED',
          message: aiResult.error || 'AI evaluation failed',
        }
      }, { status: 500 })
    }

    // Auto-save: compute composite scores and save to database
    const userId = await getDefaultUserId()
    const computed = computeAllScores(aiResult.scores)

    const notes: EvaluationNotes = {}
    if (aiResult.reasoning) {
      notes.usability = aiResult.reasoning.usability
      notes.value = aiResult.reasoning.value
      notes.features = aiResult.reasoning.features
      notes.polish = aiResult.reasoning.polish
      notes.competition = aiResult.reasoning.competition
      notes.market = aiResult.reasoning.market
      notes.monetization = aiResult.reasoning.monetization
      notes.maintenance = aiResult.reasoning.maintenance
      notes.growth = aiResult.reasoning.growth
      notes.passion = aiResult.reasoning.passion
      notes.learning = aiResult.reasoning.learning
      notes.pride = aiResult.reasoning.pride
    }

    const [evaluation] = await db
      .insert(evaluations)
      .values({
        projectId,
        evaluatorId: userId,
        scoreUsability: aiResult.scores.usability,
        scoreValue: aiResult.scores.value,
        scoreFeatures: aiResult.scores.features,
        scorePolish: aiResult.scores.polish,
        scoreCompetition: aiResult.scores.competition,
        scoreMarket: aiResult.scores.market,
        scoreMonetization: aiResult.scores.monetization,
        scoreMaintenance: aiResult.scores.maintenance,
        scoreGrowth: aiResult.scores.growth,
        scorePassion: aiResult.scores.passion,
        scoreLearning: aiResult.scores.learning,
        scorePride: aiResult.scores.pride,
        notes,
        productScore: computed.productScore?.toFixed(2),
        businessScore: computed.businessScore?.toFixed(2),
        personalScore: computed.personalScore?.toFixed(2),
        overallScore: computed.overallScore?.toFixed(2),
        recommendation: computed.recommendation,
      })
      .returning()

    // Update project's updatedAt timestamp
    await db
      .update(projects)
      .set({ updatedAt: new Date() })
      .where(eq(projects.id, projectId))

    return NextResponse.json({
      success: true,
      evaluation,
      scores: aiResult.scores,
      reasoning: aiResult.reasoning,
      firstImpressions: aiResult.firstImpressions,
      recommendations: aiResult.recommendations,
      pageSpeedData: aiResult.pageSpeedData,
      tokenUsage: aiResult.tokenUsage,
      agentBreakdown: aiResult.agentBreakdown,
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
