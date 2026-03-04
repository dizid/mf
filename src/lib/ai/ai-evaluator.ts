// Main AI evaluation orchestrator - Multi-agent team evaluation

import type { Project } from '../db/schema'
import { analyzeUrl } from '../analyzer'
import { scrapeWebsite } from './scraper'
import { callClaude, parseJsonResponse } from './claude'
import {
  buildEvaluationPrompt,
  validateEvaluationResponse,
  type AIEvaluationResponse,
  type EvaluationInput,
} from './prompts'
import { AGENT_PERSONAS, type AgentPersona } from './agent-prompts'
import { aggregateAgentScores, type AgentResult } from './agent-aggregator'

export interface AIEvaluationResult {
  success: boolean
  scores: {
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
    // Personal metrics (from business analyst agent)
    passion: number
    learning: number
    pride: number
  } | null
  reasoning: {
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
  } | null
  firstImpressions: {
    whatItDoes: string
    targetUser: string
    trustLevel: 'low' | 'medium' | 'high'
  } | null
  recommendations: string[] | null
  pageSpeedData: {
    performance: number | null
    accessibility: number | null
    seo: number | null
    mobile: number | null
  } | null
  error: string | null
  tokenUsage: {
    input: number
    output: number
  } | null
  // Per-agent breakdown for transparency
  agentBreakdown?: {
    agentId: string
    agentName: string
    scores: Record<string, number>
    summary: string
  }[]
}

// Run a single agent evaluation
async function callAgentEvaluation(
  persona: AgentPersona,
  evalPrompt: string
): Promise<AgentResult> {
  console.log(`[AI Eval] Agent "${persona.name}" starting evaluation`)

  const response = await callClaude(persona.systemPrompt, evalPrompt, {
    maxTokens: persona.scoresPersonal ? 1800 : 1500,
    temperature: persona.temperature,
  })

  const parsed = parseJsonResponse<AIEvaluationResponse>(response.content)

  if (!validateEvaluationResponse(parsed)) {
    throw new Error(`Invalid response from agent "${persona.name}"`)
  }

  console.log(`[AI Eval] Agent "${persona.name}" completed`)

  return {
    persona,
    response: parsed,
    personal: parsed.personal,
    tokenUsage: {
      input: response.inputTokens,
      output: response.outputTokens,
    },
  }
}

// Run full AI evaluation with 3 parallel agent personas
export async function runAIEvaluation(project: Project): Promise<AIEvaluationResult> {
  try {
    // Step 1: Run PageSpeed analysis
    console.log(`[AI Eval] Starting PageSpeed analysis for ${project.url}`)
    const pageSpeedData = await analyzeUrl(project.url)

    // Step 2: Scrape website content
    console.log(`[AI Eval] Scraping website content`)
    const scrapedContent = await scrapeWebsite(project.url)

    if (scrapedContent.error && !scrapedContent.mainContent) {
      console.warn(`[AI Eval] Scraping failed: ${scrapedContent.error}, continuing with limited data`)
    }

    // Step 3: Build shared evaluation input prompt
    const evalInput: EvaluationInput = {
      projectName: project.name,
      url: project.url,
      description: project.description,
      category: project.category,
      targetAudience: project.targetAudience,
      competitors: project.competitors,
      pageSpeed: {
        performance: pageSpeedData.performance,
        accessibility: pageSpeedData.accessibility,
        seo: pageSpeedData.seo,
        mobile: pageSpeedData.mobile,
        technical: pageSpeedData.technical,
        security: pageSpeedData.security,
        issues: pageSpeedData.issues,
      },
      scrapedContent,
    }

    const evalPrompt = buildEvaluationPrompt(evalInput)

    // Step 4: Run 3 agent evaluations in parallel
    console.log(`[AI Eval] Running ${AGENT_PERSONAS.length} agent evaluations in parallel`)
    const agentResults = await Promise.allSettled(
      AGENT_PERSONAS.map(persona => callAgentEvaluation(persona, evalPrompt))
    )

    // Collect successful results
    const successfulResults: AgentResult[] = []
    for (const result of agentResults) {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value)
      } else {
        console.error(`[AI Eval] Agent failed:`, result.reason)
      }
    }

    if (successfulResults.length === 0) {
      throw new Error('All agent evaluations failed')
    }

    console.log(`[AI Eval] ${successfulResults.length}/${AGENT_PERSONAS.length} agents succeeded`)

    // Step 5: Aggregate scores from all agents
    const aggregated = aggregateAgentScores(successfulResults)

    // Step 6: Return combined result
    return {
      success: true,
      scores: aggregated.scores,
      reasoning: aggregated.reasoning,
      firstImpressions: aggregated.firstImpressions,
      recommendations: aggregated.recommendations,
      pageSpeedData: {
        performance: pageSpeedData.performance,
        accessibility: pageSpeedData.accessibility,
        seo: pageSpeedData.seo,
        mobile: pageSpeedData.mobile,
      },
      error: null,
      tokenUsage: aggregated.tokenUsage,
      agentBreakdown: aggregated.agentBreakdown,
    }
  } catch (error) {
    console.error('[AI Eval] Error:', error)
    return {
      success: false,
      scores: null,
      reasoning: null,
      firstImpressions: null,
      recommendations: null,
      pageSpeedData: null,
      error: error instanceof Error ? error.message : 'Unknown error during AI evaluation',
      tokenUsage: null,
    }
  }
}

// Estimate cost of an evaluation (in USD) - now 3x for multi-agent
export function estimateEvaluationCost(inputTokens: number, outputTokens: number): number {
  const inputCostPer1K = 0.003
  const outputCostPer1K = 0.015
  return (inputTokens / 1000) * inputCostPer1K + (outputTokens / 1000) * outputCostPer1K
}
