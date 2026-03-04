// Aggregates scores from multiple AI agent evaluations into a single result

import type { AIEvaluationResponse } from './prompts'
import { AGENT_WEIGHTS, type AgentPersona } from './agent-prompts'

// Result from a single agent evaluation
export interface AgentResult {
  persona: AgentPersona
  response: AIEvaluationResponse
  // Personal metrics only from business analyst
  personal?: {
    passion: { score: number; reason: string }
    learning: { score: number; reason: string }
    pride: { score: number; reason: string }
  }
  tokenUsage: { input: number; output: number }
}

// Final aggregated scores (all 12 metrics)
export interface AggregatedScores {
  // Product metrics
  usability: number
  value: number
  features: number
  polish: number
  competition: number
  // Business metrics
  market: number
  monetization: number
  maintenance: number
  growth: number
  // Personal metrics
  passion: number
  learning: number
  pride: number
}

export interface AggregatedReasoning {
  usability: string
  value: string
  features: string
  polish: string
  competition: string
  market: string
  monetization: string
  maintenance: string
  growth: string
  passion: string
  learning: string
  pride: string
  summary: string
}

export interface AggregatedResult {
  scores: AggregatedScores
  reasoning: AggregatedReasoning
  firstImpressions: {
    whatItDoes: string
    targetUser: string
    trustLevel: 'low' | 'medium' | 'high'
  }
  recommendations: string[]
  tokenUsage: { input: number; output: number }
  agentBreakdown: {
    agentId: string
    agentName: string
    scores: Record<string, number>
    summary: string
  }[]
}

const STANDARD_METRICS = [
  'usability', 'value', 'features', 'polish', 'competition',
  'market', 'monetization', 'maintenance', 'growth',
] as const

// Get a metric score from an agent's response
function getAgentScore(response: AIEvaluationResponse, metric: string): number {
  const productMetrics = ['usability', 'value', 'features', 'polish', 'competition']
  const businessMetrics = ['market', 'monetization', 'maintenance', 'growth']

  if (productMetrics.includes(metric)) {
    return response.product[metric as keyof typeof response.product].score
  }
  if (businessMetrics.includes(metric)) {
    return response.business[metric as keyof typeof response.business].score
  }
  return 5 // fallback
}

// Get a metric reason from an agent's response
function getAgentReason(response: AIEvaluationResponse, metric: string): string {
  const productMetrics = ['usability', 'value', 'features', 'polish', 'competition']
  const businessMetrics = ['market', 'monetization', 'maintenance', 'growth']

  if (productMetrics.includes(metric)) {
    return response.product[metric as keyof typeof response.product].reason
  }
  if (businessMetrics.includes(metric)) {
    return response.business[metric as keyof typeof response.business].reason
  }
  return ''
}

// Aggregate scores from multiple agents using weighted averaging
export function aggregateAgentScores(results: AgentResult[]): AggregatedResult {
  // Build agent index map: persona.id -> index in AGENT_WEIGHTS tuple
  const agentIndexMap: Record<string, number> = {
    'first-timer': 0,
    'power-user': 1,
    'business-analyst': 2,
  }

  // Calculate weighted average for each standard metric
  const scores: Record<string, number> = {}
  const reasoning: Record<string, string> = {}

  for (const metric of STANDARD_METRICS) {
    const weights = AGENT_WEIGHTS[metric]
    let weightedSum = 0
    let totalWeight = 0
    let bestAgentIdx = -1
    let bestWeight = 0

    for (const result of results) {
      const idx = agentIndexMap[result.persona.id]
      if (idx === undefined) continue

      const weight = weights[idx]
      const score = getAgentScore(result.response, metric)

      weightedSum += score * weight
      totalWeight += weight

      // Track agent with highest weight for reasoning
      if (weight > bestWeight) {
        bestWeight = weight
        bestAgentIdx = results.indexOf(result)
      }
    }

    // Normalize weights if not all 3 agents succeeded
    scores[metric] = totalWeight > 0
      ? Math.round(weightedSum / totalWeight)
      : 5

    // Use reasoning from the agent with highest weight for this metric
    if (bestAgentIdx >= 0) {
      const bestResult = results[bestAgentIdx]
      const reason = getAgentReason(bestResult.response, metric)
      reasoning[metric] = `[${bestResult.persona.name}] ${reason}`
    }
  }

  // Personal metrics: use business analyst's scores directly
  const analyst = results.find(r => r.persona.scoresPersonal && r.personal)
  if (analyst?.personal) {
    scores.passion = analyst.personal.passion.score
    scores.learning = analyst.personal.learning.score
    scores.pride = analyst.personal.pride.score
    reasoning.passion = `[${analyst.persona.name}] ${analyst.personal.passion.reason}`
    reasoning.learning = `[${analyst.persona.name}] ${analyst.personal.learning.reason}`
    reasoning.pride = `[${analyst.persona.name}] ${analyst.personal.pride.reason}`
  } else {
    // Fallback if analyst failed
    scores.passion = 5
    scores.learning = 5
    scores.pride = 5
    reasoning.passion = 'Could not assess (agent unavailable)'
    reasoning.learning = 'Could not assess (agent unavailable)'
    reasoning.pride = 'Could not assess (agent unavailable)'
  }

  // First impressions: prefer first-timer's perspective
  const firstTimer = results.find(r => r.persona.id === 'first-timer')
  const firstImpressions = firstTimer?.response.firstImpressions
    ?? results[0].response.firstImpressions

  // Aggregate summary from all agents
  const summaries = results.map(r => `**${r.persona.name}:** ${r.response.summary}`)
  reasoning.summary = summaries.join('\n\n')

  // Merge and deduplicate recommendations
  const allRecs = results.flatMap(r => r.response.recommendations)
  const recommendations = deduplicateRecommendations(allRecs).slice(0, 5)

  // Sum token usage across all agents
  const tokenUsage = {
    input: results.reduce((sum, r) => sum + r.tokenUsage.input, 0),
    output: results.reduce((sum, r) => sum + r.tokenUsage.output, 0),
  }

  // Build agent breakdown for transparency
  const agentBreakdown = results.map(r => {
    const agentScores: Record<string, number> = {}
    for (const metric of STANDARD_METRICS) {
      agentScores[metric] = getAgentScore(r.response, metric)
    }
    return {
      agentId: r.persona.id,
      agentName: r.persona.name,
      scores: agentScores,
      summary: r.response.summary,
    }
  })

  return {
    scores: scores as unknown as AggregatedScores,
    reasoning: reasoning as unknown as AggregatedReasoning,
    firstImpressions,
    recommendations,
    tokenUsage,
    agentBreakdown,
  }
}

// Deduplicate recommendations by similarity (simple substring matching)
function deduplicateRecommendations(recs: string[]): string[] {
  const unique: string[] = []

  for (const rec of recs) {
    const recLower = rec.toLowerCase()
    // Check if a similar recommendation already exists
    const isDuplicate = unique.some(existing => {
      const existingLower = existing.toLowerCase()
      // Check for significant word overlap
      const recWords = new Set(recLower.split(/\s+/).filter(w => w.length > 3))
      const existingWords = new Set(existingLower.split(/\s+/).filter(w => w.length > 3))
      const overlap = [...recWords].filter(w => existingWords.has(w)).length
      const maxWords = Math.max(recWords.size, existingWords.size)
      // More than 50% word overlap = duplicate
      return maxWords > 0 && overlap / maxWords > 0.5
    })

    if (!isDuplicate) {
      unique.push(rec)
    }
  }

  return unique
}
