import { NextResponse } from 'next/server'
import { isAuthenticated, getDefaultUserId } from '@/lib/password-auth'
import { getUserLimits } from '@/lib/limits'

// GET /api/limits - Get user's usage limits
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be signed in',
      }
    }, { status: 401 })
  }

  try {
    const userId = await getDefaultUserId()
    const limits = await getUserLimits(userId)

    return NextResponse.json(limits)
  } catch (error) {
    console.error('Error getting limits:', error)
    return NextResponse.json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get limits',
      }
    }, { status: 500 })
  }
}
