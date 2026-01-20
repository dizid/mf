// LLM prompt templates for AI evaluation

import type { ScrapedContent } from './scraper'
import type { Competitor } from '../db/schema'

export const SYSTEM_PROMPT = `You are an expert product reviewer evaluating web applications.
Think like a real human visiting this site for the first time.

## Your Evaluation Approach

**1. FIRST IMPRESSIONS (5-second test)**
- What do you immediately understand about this product?
- Is the purpose instantly clear?
- Does it feel trustworthy and professional?

**2. USABILITY WALKTHROUGH**
- Can a new user figure out what to do without instructions?
- Are CTAs clear and compelling?
- Is navigation intuitive or confusing?

**3. PRODUCT-MARKET FIT**
- Who specifically needs this?
- How urgent is the problem it solves?
- Is the value proposition compelling?

**4. TRUST & CREDIBILITY**
- Does it look professional and maintained?
- Are there trust signals (testimonials, logos, security)?
- Would you enter payment info here?

## Scoring Guidelines
- 1-3: Fundamental problems - confusing, untrustworthy, unclear purpose
- 4-5: Functional but significant UX/clarity gaps
- 6-7: Good execution, minor friction points
- 8-9: Excellent - clear, trustworthy, compelling
- 10: Best in class

Be honest and specific. Avoid generic feedback.
Return ONLY valid JSON, no markdown.`

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

## UX Signals
- CTAs Found: ${scrapedContent.ctas?.length ? scrapedContent.ctas.slice(0, 5).join(', ') : 'None detected'}
- Social Proof: ${scrapedContent.hasSocialProof ? 'Yes (testimonials/reviews present)' : 'No'}
- Security Badges: ${scrapedContent.hasSecurityBadges ? 'Yes' : 'No'}
- Video Content: ${scrapedContent.hasVideo ? 'Yes' : 'No'}
- FAQ Section: ${scrapedContent.hasFaq ? 'Yes' : 'No'}

## Headings Found
${scrapedContent.headings.slice(0, 10).join('\n') || 'None found'}

## Page Content (excerpt)
${scrapedContent.mainContent.substring(0, 3000) || 'Could not extract content'}

---

## Step 1: First Impressions

Before scoring, capture your immediate reaction (5-second test):
- What does this product do? (one sentence)
- Who is it for? (specific persona)
- Trust level: Would you enter your email? Credit card?

## Step 2: Score Each Metric

Evaluate on these 9 metrics (1-10 with brief reason):

**Product Metrics:**
1. usability - Can a new user accomplish the core task without confusion? Consider first-time experience, cognitive load, clarity of next steps.
2. value - Is it immediately clear what problem this solves and why it matters? Would you pay for this?
3. features - Does it have what's needed to deliver on its promise? Not feature-count, but the right features.
4. polish - Does it feel finished? Professional design, smooth interactions, no errors or rough edges.
5. competition - What makes this different from alternatives? Is the differentiator clear and compelling?

**Business Metrics:**
6. market - Is there a real, reachable audience who would want this? How badly do they need it?
7. monetization - Is there a clear path to revenue? Pricing visible? Value justifies cost?
8. maintenance - How complex would this be to maintain? (1=simple, 10=very complex infrastructure).
9. growth - Are there natural ways for this to spread? Word-of-mouth, viral loops, network effects?

## Step 3: Recommendations

Provide 3 specific, actionable improvements that would have the biggest impact.

Return your evaluation as JSON in this exact format:
{
  "firstImpressions": {
    "whatItDoes": "One sentence description of the product",
    "targetUser": "Specific persona who needs this",
    "trustLevel": "low" | "medium" | "high"
  },
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
  "recommendations": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
  "summary": "2-3 sentence overall assessment with key strengths and areas for improvement"
}`
}

// Type for the expected JSON response
export interface AIEvaluationResponse {
  firstImpressions: {
    whatItDoes: string
    targetUser: string
    trustLevel: 'low' | 'medium' | 'high'
  }
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
  recommendations: string[]
  summary: string
}

// Validate the response structure
export function validateEvaluationResponse(data: unknown): data is AIEvaluationResponse {
  if (typeof data !== 'object' || data === null) return false

  const d = data as Record<string, unknown>

  // Check firstImpressions
  if (typeof d.firstImpressions !== 'object' || d.firstImpressions === null) return false
  const fi = d.firstImpressions as Record<string, unknown>
  if (typeof fi.whatItDoes !== 'string') return false
  if (typeof fi.targetUser !== 'string') return false
  if (!['low', 'medium', 'high'].includes(fi.trustLevel as string)) return false

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

  // Check recommendations
  if (!Array.isArray(d.recommendations)) return false
  if (d.recommendations.length === 0) return false
  for (const rec of d.recommendations) {
    if (typeof rec !== 'string') return false
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
