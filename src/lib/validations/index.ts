import { z } from 'zod'

// Score validation (1-10 integer)
const scoreSchema = z.number().int().min(1).max(10).optional()

// Project validation schemas
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Invalid URL format')
    .max(500, 'URL must be 500 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .trim()
    .optional()
    .nullable(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

// Evaluation validation schemas
export const createEvaluationSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  scores: z.object({
    // Product metrics
    usability: scoreSchema,
    value: scoreSchema,
    features: scoreSchema,
    polish: scoreSchema,
    competition: scoreSchema,
    // Business metrics
    market: scoreSchema,
    monetization: scoreSchema,
    maintenance: scoreSchema,
    growth: scoreSchema,
    // Personal metrics
    passion: scoreSchema,
    learning: scoreSchema,
    pride: scoreSchema,
  }),
  notes: z
    .object({
      usability: z.string().max(500).optional(),
      value: z.string().max(500).optional(),
      features: z.string().max(500).optional(),
      polish: z.string().max(500).optional(),
      competition: z.string().max(500).optional(),
      market: z.string().max(500).optional(),
      monetization: z.string().max(500).optional(),
      maintenance: z.string().max(500).optional(),
      growth: z.string().max(500).optional(),
      passion: z.string().max(500).optional(),
      learning: z.string().max(500).optional(),
      pride: z.string().max(500).optional(),
    })
    .optional(),
})

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>

// Error response types
export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVER_ERROR'

export interface ApiError {
  error: {
    code: ErrorCode
    message: string
    details?: Record<string, string[]>
  }
}

// Helper to format Zod errors
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root'
    if (!details[path]) {
      details[path] = []
    }
    details[path].push(issue.message)
  }
  return details
}
