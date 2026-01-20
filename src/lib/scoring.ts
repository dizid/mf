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

  // 🔄 PIVOT: Good technical foundation but mediocre value (not meeting KEEP criteria)
  // Note: value <= 5 catches cases where product is good but value isn't great
  // and maintenance is too high for KEEP (which requires maintenance <= 4)
  if ((productScore ?? 0) >= 6 && valueScore <= 5) {
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
    improvements: [
      'Conduct 3 user interviews to identify pain points',
      'Add onboarding flow for new users',
      'Simplify the most common user journey',
    ],
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
    improvements: [
      'Talk to 5 potential users about their needs',
      'Focus on solving one problem really well',
      'Remove features that don\'t serve the core value',
    ],
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
    improvements: [
      'List the top 3 missing features users ask for',
      'Build one high-impact feature this month',
      'Consider what competitors have that you lack',
    ],
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
    improvements: [
      'Fix the 5 most annoying bugs',
      'Add loading states and error handling',
      'Improve visual consistency across screens',
    ],
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
    improvements: [
      'Identify your unique differentiator',
      'Study top 3 competitors\' weaknesses',
      'Double down on what makes you different',
    ],
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
    improvements: [
      'Research adjacent markets you could serve',
      'Identify underserved segments in your space',
      'Consider international expansion potential',
    ],
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
    improvements: [
      'Test willingness to pay with a landing page',
      'Identify your highest-value features for premium tier',
      'Look at how competitors monetize',
    ],
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
    improvements: [
      'Automate repetitive maintenance tasks',
      'Add monitoring and alerting',
      'Reduce dependencies and complexity',
    ],
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
    improvements: [
      'Add sharing or referral mechanisms',
      'Build features that get better with more users',
      'Create content that attracts organic traffic',
    ],
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
    improvements: [
      'Work on the parts you enjoy most',
      'Outsource or automate tedious tasks',
      'Set smaller, achievable goals for quick wins',
    ],
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
    improvements: [
      'Add a feature using a technology you want to learn',
      'Refactor using a new pattern or approach',
      'Set a learning goal tied to the project',
    ],
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
    improvements: [
      'Redesign the landing page or hero section',
      'Add one showcase-worthy feature',
      'Write a blog post or case study about it',
    ],
  },
} as const

export type MetricKey = keyof typeof metricDefinitions
