// LLM prompt templates for AI evaluation

import type { ScrapedContent } from './scraper'
import type { Competitor } from '../db/schema'

export const SYSTEM_PROMPT = `You are an expert app evaluator helping indie developers and solopreneurs assess their web applications objectively. You analyze websites and provide scores on a 1-10 scale.

Scoring Guidelines:
- 1-3: Poor - fundamental problems, missing basics
- 4-5: Below average - functional but significant gaps
- 6-7: Good - solid implementation, minor improvements needed
- 8-9: Very good - well executed, stands out
- 10: Exceptional - best in class

Important:
- Be honest and constructive. Indie apps should be judged fairly for their scope and stage.
- Consider the target audience when evaluating.
- Provide brief, actionable reasoning for each score.
- Return ONLY valid JSON, no additional text or markdown.`

export interface EvaluationInput {
  projectName: string
  url: string
  description?: string | null
  category?: string | null
  targetAudience?: string | null
  competitors?: Competitor[] | null
  pageSpeed: {
    performance: number | null
    accessibility: number | null
    seo: number | null
    mobile: number | null
    technical: number | null
    security: number | null
    issues: { category: string; severity: string; message: string }[]
  }
  scrapedContent: ScrapedContent
}

export function buildEvaluationPrompt(data: EvaluationInput): string {
  const { projectName, url, description, category, targetAudience, competitors, pageSpeed, scrapedContent } = data

  // Format competitors section
  const competitorsText = competitors?.length
    ? competitors.map(c => `- ${c.name}${c.url ? ` (${c.url})` : ''}${c.notes ? `: ${c.notes}` : ''}`).join('\n')
    : 'None specified'

  // Format issues
  const issuesText = pageSpeed.issues.length
    ? pageSpeed.issues.map(i => `- [${i.severity}] ${i.message}`).join('\n')
    : 'No critical issues detected'

  // Format detected tech
  const techText = scrapedContent.technologies.length
    ? scrapedContent.technologies.join(', ')
    : 'Not detected'

  return `## Project Information
- Name: ${projectName}
- URL: ${url}
- Description: ${description || 'Not provided'}
- Category: ${category || 'Not specified'}
- Target Audience: ${targetAudience || 'Not specified'}

## Competitors
${competitorsText}

## Technical Analysis (PageSpeed Insights, 0-100 scale)
- Performance: ${pageSpeed.performance ?? 'N/A'}
- Accessibility: ${pageSpeed.accessibility ?? 'N/A'}
- SEO: ${pageSpeed.seo ?? 'N/A'}
- Mobile: ${pageSpeed.mobile ?? 'N/A'}
- Technical: ${pageSpeed.technical ?? 'N/A'}
- Security (HTTPS): ${pageSpeed.security ?? 'N/A'}

## Detected Issues
${issuesText}

## Website Details
- Page Title: ${scrapedContent.title || 'Not found'}
- Meta Description: ${scrapedContent.metaDescription || 'Not found'}
- Has Pricing Page: ${scrapedContent.hasPricing ? 'Yes' : 'No'}
- Has Login/Auth: ${scrapedContent.hasLogin ? 'Yes' : 'No'}
- Technologies: ${techText}

## Headings Found
${scrapedContent.headings.slice(0, 10).join('\n') || 'None found'}

## Page Content (excerpt)
${scrapedContent.mainContent.substring(0, 3000) || 'Could not extract content'}

---

## Your Task
Evaluate this web application on the following 9 metrics. For each metric, provide a score (1-10) and a brief reason (1 sentence).

**Product Metrics:**
1. usability - How easy is it to use? Consider navigation, clarity, learning curve.
2. value - Does it solve a real problem? How compelling is the value proposition?
3. features - How complete is the feature set for its stated purpose?
4. polish - What's the quality level? Consider design, errors, loading states.
5. competition - How does it compare to alternatives? Is there a clear differentiator?

**Business Metrics:**
6. market - How big is the potential market? Consider the target audience size.
7. monetization - Can this make money? Look for pricing, payment integrations, premium features.
8. maintenance - How much effort to maintain? Consider complexity, dependencies (1=easy, 10=high effort).
9. growth - Can it scale and grow? Look for viral features, sharing, network effects.

Return your evaluation as JSON in this exact format:
{
  "product": {
    "usability": { "score": <1-10>, "reason": "..." },
    "value": { "score": <1-10>, "reason": "..." },
    "features": { "score": <1-10>, "reason": "..." },
    "polish": { "score": <1-10>, "reason": "..." },
    "competition": { "score": <1-10>, "reason": "..." }
  },
  "business": {
    "market": { "score": <1-10>, "reason": "..." },
    "monetization": { "score": <1-10>, "reason": "..." },
    "maintenance": { "score": <1-10>, "reason": "..." },
    "growth": { "score": <1-10>, "reason": "..." }
  },
  "summary": "2-3 sentence overall assessment with key strengths and areas for improvement"
}`
}

// Type for the expected JSON response
export interface AIEvaluationResponse {
  product: {
    usability: { score: number; reason: string }
    value: { score: number; reason: string }
    features: { score: number; reason: string }
    polish: { score: number; reason: string }
    competition: { score: number; reason: string }
  }
  business: {
    market: { score: number; reason: string }
    monetization: { score: number; reason: string }
    maintenance: { score: number; reason: string }
    growth: { score: number; reason: string }
  }
  summary: string
}

// Validate the response structure
export function validateEvaluationResponse(data: unknown): data is AIEvaluationResponse {
  if (typeof data !== 'object' || data === null) return false

  const d = data as Record<string, unknown>

  // Check product metrics
  if (typeof d.product !== 'object' || d.product === null) return false
  const product = d.product as Record<string, unknown>
  const productKeys = ['usability', 'value', 'features', 'polish', 'competition']
  for (const key of productKeys) {
    if (!isValidMetric(product[key])) return false
  }

  // Check business metrics
  if (typeof d.business !== 'object' || d.business === null) return false
  const business = d.business as Record<string, unknown>
  const businessKeys = ['market', 'monetization', 'maintenance', 'growth']
  for (const key of businessKeys) {
    if (!isValidMetric(business[key])) return false
  }

  // Check summary
  if (typeof d.summary !== 'string') return false

  return true
}

function isValidMetric(metric: unknown): boolean {
  if (typeof metric !== 'object' || metric === null) return false
  const m = metric as Record<string, unknown>
  return typeof m.score === 'number' && m.score >= 1 && m.score <= 10 && typeof m.reason === 'string'
}
