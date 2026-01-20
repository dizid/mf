// Main AI evaluation orchestrator

import type { Project } from '../db/schema'
import { analyzeUrl } from '../analyzer'
import { scrapeWebsite, type ScrapedContent } from './scraper'
import { callClaude, parseJsonResponse } from './claude'
import {
  SYSTEM_PROMPT,
  buildEvaluationPrompt,
  validateEvaluationResponse,
  type AIEvaluationResponse,
  type EvaluationInput,
} from './prompts'

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
}

// Run full AI evaluation on a project
export async function runAIEvaluation(project: Project): Promise<AIEvaluationResult> {
  try {
    // Step 1: Run PageSpeed analysis
    console.log(`[AI Eval] Starting PageSpeed analysis for ${project.url}`)
    const pageSpeedData = await analyzeUrl(project.url)

    // Step 2: Scrape website content
    console.log(`[AI Eval] Scraping website content`)
    const scrapedContent = await scrapeWebsite(project.url)

    if (scrapedContent.error && !scrapedContent.mainContent) {
      // If we couldn't scrape at all, still try with PageSpeed data
      console.warn(`[AI Eval] Scraping failed: ${scrapedContent.error}, continuing with limited data`)
    }

    // Step 3: Build evaluation input
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

    // Step 4: Build prompt and call Claude
    console.log(`[AI Eval] Calling Claude API`)
    const prompt = buildEvaluationPrompt(evalInput)
    const response = await callClaude(SYSTEM_PROMPT, prompt, {
      maxTokens: 1500,
      temperature: 0.3,
    })

    // Step 5: Parse and validate response
    console.log(`[AI Eval] Parsing response`)
    const parsed = parseJsonResponse<AIEvaluationResponse>(response.content)

    if (!validateEvaluationResponse(parsed)) {
      throw new Error('Invalid response structure from AI')
    }

    // Step 6: Return combined result
    return {
      success: true,
      scores: {
        usability: parsed.product.usability.score,
        value: parsed.product.value.score,
        features: parsed.product.features.score,
        polish: parsed.product.polish.score,
        competition: parsed.product.competition.score,
        market: parsed.business.market.score,
        monetization: parsed.business.monetization.score,
        maintenance: parsed.business.maintenance.score,
        growth: parsed.business.growth.score,
      },
      reasoning: {
        usability: parsed.product.usability.reason,
        value: parsed.product.value.reason,
        features: parsed.product.features.reason,
        polish: parsed.product.polish.reason,
        competition: parsed.product.competition.reason,
        market: parsed.business.market.reason,
        monetization: parsed.business.monetization.reason,
        maintenance: parsed.business.maintenance.reason,
        growth: parsed.business.growth.reason,
        summary: parsed.summary,
      },
      firstImpressions: parsed.firstImpressions,
      recommendations: parsed.recommendations,
      pageSpeedData: {
        performance: pageSpeedData.performance,
        accessibility: pageSpeedData.accessibility,
        seo: pageSpeedData.seo,
        mobile: pageSpeedData.mobile,
      },
      error: null,
      tokenUsage: {
        input: response.inputTokens,
        output: response.outputTokens,
      },
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

// Estimate cost of an evaluation (in USD)
export function estimateEvaluationCost(inputTokens: number, outputTokens: number): number {
  // Claude Sonnet pricing (as of 2024)
  const inputCostPer1K = 0.003
  const outputCostPer1K = 0.015

  return (inputTokens / 1000) * inputCostPer1K + (outputTokens / 1000) * outputCostPer1K
}
