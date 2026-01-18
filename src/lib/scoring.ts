import type { Recommendation } from './db/schema'

interface Scores {
  // Product Metrics (1-10)
  usability?: number | null
  value?: number | null
  features?: number | null
  polish?: number | null
  competition?: number | null

  // Business Metrics (1-10)
  market?: number | null
  monetization?: number | null
  maintenance?: number | null // Lower is better (inverted in calculation)
  growth?: number | null

  // Personal Metrics (1-10)
  passion?: number | null
  learning?: number | null
  pride?: number | null
}

interface ComputedScores {
  productScore: number | null
  businessScore: number | null
  personalScore: number | null
  overallScore: number | null
  recommendation: Recommendation
}

// Calculate average of non-null values
function avg(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v != null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

// Calculate product score (average of product metrics)
export function calculateProductScore(scores: Scores): number | null {
  return avg([
    scores.usability,
    scores.value,
    scores.features,
    scores.polish,
    scores.competition,
  ])
}

// Calculate business score
// Note: maintenance is inverted (high maintenance = low score contribution)
export function calculateBusinessScore(scores: Scores): number | null {
  const values = [
    scores.market,
    scores.monetization,
    scores.growth,
  ]

  // Invert maintenance score (10 - maintenance gives us "ease of maintenance")
  if (scores.maintenance != null) {
    values.push(10 - scores.maintenance)
  }

  return avg(values)
}

// Calculate personal score
export function calculatePersonalScore(scores: Scores): number | null {
  return avg([
    scores.passion,
    scores.learning,
    scores.pride,
  ])
}

// Calculate overall weighted score
// Product: 50%, Business: 30%, Personal: 20%
export function calculateOverallScore(
  productScore: number | null,
  businessScore: number | null,
  personalScore: number | null
): number | null {
  const scores: { value: number; weight: number }[] = []

  if (productScore != null) scores.push({ value: productScore, weight: 0.5 })
  if (businessScore != null) scores.push({ value: businessScore, weight: 0.3 })
  if (personalScore != null) scores.push({ value: personalScore, weight: 0.2 })

  if (scores.length === 0) return null

  // Normalize weights if some scores are missing
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0)
  return scores.reduce((sum, s) => sum + (s.value * s.weight / totalWeight), 0)
}

// Determine recommendation based on scores
export function calculateRecommendation(scores: Scores): Recommendation {
  const productScore = calculateProductScore(scores)
  const businessScore = calculateBusinessScore(scores)
  const valueScore = scores.value ?? 0
  const maintenanceScore = scores.maintenance ?? 5

  // 🚀 INVEST: High value (≥7) + High potential (≥7)
  if (valueScore >= 7 && (businessScore ?? 0) >= 7) {
    return 'invest'
  }

  // 🗑️ DROP: Low value (≤4) OR high maintenance (≥7) + low return
  if (valueScore <= 4) {
    return 'drop'
  }
  if (maintenanceScore >= 7 && (productScore ?? 0) < 6) {
    return 'drop'
  }

  // ✅ KEEP: Good value (≥5) + Low maintenance (≤4)
  if (valueScore >= 5 && maintenanceScore <= 4) {
    return 'keep'
  }

  // 🔄 PIVOT: Good technical foundation but low value/market fit
  if ((productScore ?? 0) >= 6 && valueScore < 5) {
    return 'pivot'
  }

  // ⏸️ PAUSE: Everything else (uncertain)
  return 'pause'
}

// Calculate all scores and recommendation
export function computeAllScores(scores: Scores): ComputedScores {
  const productScore = calculateProductScore(scores)
  const businessScore = calculateBusinessScore(scores)
  const personalScore = calculatePersonalScore(scores)
  const overallScore = calculateOverallScore(productScore, businessScore, personalScore)
  const recommendation = calculateRecommendation(scores)

  return {
    productScore,
    businessScore,
    personalScore,
    overallScore,
    recommendation,
  }
}

// Recommendation metadata for UI
export const recommendationInfo: Record<Recommendation, {
  emoji: string
  label: string
  color: string
  bgColor: string
  description: string
}> = {
  invest: {
    emoji: '🚀',
    label: 'INVEST',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'High potential - double down on this app',
  },
  keep: {
    emoji: '✅',
    label: 'KEEP',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Solid performer - maintain with minor updates',
  },
  pivot: {
    emoji: '🔄',
    label: 'PIVOT',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    description: 'Good foundation - needs new direction',
  },
  pause: {
    emoji: '⏸️',
    label: 'PAUSE',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    description: 'Uncertain - revisit in 3 months',
  },
  drop: {
    emoji: '🗑️',
    label: 'DROP',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Low return - consider archiving',
  },
}

// Metric definitions for the rating form
export const metricDefinitions = {
  // Product Metrics
  usability: {
    label: 'Usability',
    category: 'product',
    question: 'How easy is it to use?',
    hints: {
      1: 'Confusing, users get lost',
      5: 'Decent, some learning curve',
      10: 'Intuitive, anyone can use it instantly',
    },
  },
  value: {
    label: 'User Value',
    category: 'product',
    question: 'Does it solve a real problem?',
    hints: {
      1: 'No clear problem solved',
      5: 'Solves a problem, but not well',
      10: 'Essential, users would pay for this',
    },
  },
  features: {
    label: 'Features',
    category: 'product',
    question: 'How complete is the feature set?',
    hints: {
      1: 'Missing critical features',
      5: 'Core features done, some gaps',
      10: 'Full-featured, nothing missing',
    },
  },
  polish: {
    label: 'Polish',
    category: 'product',
    question: 'What\'s the quality level?',
    hints: {
      1: 'Buggy, rough edges everywhere',
      5: 'Works but feels unfinished',
      10: 'Professional, polished experience',
    },
  },
  competition: {
    label: 'Competition',
    category: 'product',
    question: 'How do you compare to competitors?',
    hints: {
      1: 'Many better alternatives exist',
      5: 'On par with competition',
      10: 'Best in class, clear differentiator',
    },
  },

  // Business Metrics
  market: {
    label: 'Market Size',
    category: 'business',
    question: 'How big is the potential market?',
    hints: {
      1: 'Tiny niche, very few users',
      5: 'Medium market, decent audience',
      10: 'Huge market, mass appeal',
    },
  },
  monetization: {
    label: 'Monetization',
    category: 'business',
    question: 'Can this make money?',
    hints: {
      1: 'No clear path to revenue',
      5: 'Could monetize somehow',
      10: 'Clear, proven revenue model',
    },
  },
  maintenance: {
    label: 'Maintenance Cost',
    category: 'business',
    question: 'How much effort to maintain?',
    hints: {
      1: 'Set it and forget it',
      5: 'Regular updates needed',
      10: 'Constant firefighting',
    },
    inverted: true, // Lower is better
  },
  growth: {
    label: 'Growth Potential',
    category: 'business',
    question: 'Can it scale and grow?',
    hints: {
      1: 'No growth path',
      5: 'Some growth possible',
      10: 'Viral potential, exponential growth',
    },
  },

  // Personal Metrics
  passion: {
    label: 'Passion',
    category: 'personal',
    question: 'Do you enjoy working on it?',
    hints: {
      1: 'Dread it',
      5: 'It\'s okay',
      10: 'Love it, can\'t wait to work on it',
    },
  },
  learning: {
    label: 'Learning',
    category: 'personal',
    question: 'Are you gaining skills?',
    hints: {
      1: 'Nothing new to learn',
      5: 'Some learning opportunities',
      10: 'Constantly learning new things',
    },
  },
  pride: {
    label: 'Pride',
    category: 'personal',
    question: 'Would you show it in your portfolio?',
    hints: {
      1: 'Embarrassed by it',
      5: 'It\'s decent work',
      10: 'Proud to show anyone',
    },
  },
} as const

export type MetricKey = keyof typeof metricDefinitions
