import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, projects, evaluations, type EvaluationNotes } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { computeAllScores } from '@/lib/scoring'
import { createEvaluationSchema, formatZodErrors } from '@/lib/validations'

// POST /api/evaluate - Save an evaluation with manual scores
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be signed in to create an evaluation',
      }
    }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Validate input
    const result = createEvaluationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid evaluation data',
          details: formatZodErrors(result.error),
        }
      }, { status: 400 })
    }

    const { projectId, scores, notes } = result.data

    // Verify project exists
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

    // Compute composite scores and recommendation
    const computed = computeAllScores({
      usability: scores.usability,
      value: scores.value,
      features: scores.features,
      polish: scores.polish,
      competition: scores.competition,
      market: scores.market,
      monetization: scores.monetization,
      maintenance: scores.maintenance,
      growth: scores.growth,
      passion: scores.passion,
      learning: scores.learning,
      pride: scores.pride,
    })

    // Create evaluation record
    const [evaluation] = await db
      .insert(evaluations)
      .values({
        projectId,
        evaluatorId: session.user.id,

        // Product metrics
        scoreUsability: scores.usability,
        scoreValue: scores.value,
        scoreFeatures: scores.features,
        scorePolish: scores.polish,
        scoreCompetition: scores.competition,

        // Business metrics
        scoreMarket: scores.market,
        scoreMonetization: scores.monetization,
        scoreMaintenance: scores.maintenance,
        scoreGrowth: scores.growth,

        // Personal metrics
        scorePassion: scores.passion,
        scoreLearning: scores.learning,
        scorePride: scores.pride,

        // Notes
        notes: notes as EvaluationNotes,

        // Computed scores
        productScore: computed.productScore?.toFixed(2),
        businessScore: computed.businessScore?.toFixed(2),
        personalScore: computed.personalScore?.toFixed(2),
        overallScore: computed.overallScore?.toFixed(2),

        // Recommendation
        recommendation: computed.recommendation,
      })
      .returning()

    // Update project's updatedAt timestamp
    await db
      .update(projects)
      .set({ updatedAt: new Date() })
      .where(eq(projects.id, projectId))

    return NextResponse.json(evaluation, { status: 201 })
  } catch (error) {
    console.error('Error saving evaluation:', error)
    return NextResponse.json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to save evaluation. Please try again.',
      }
    }, { status: 500 })
  }
}
