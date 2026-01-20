import { describe, it, expect } from 'vitest'
import {
  calculateProductScore,
  calculateBusinessScore,
  calculatePersonalScore,
  calculateOverallScore,
  calculateRecommendation,
  computeAllScores,
  recommendationInfo,
  metricDefinitions,
} from '../scoring'

describe('calculateProductScore', () => {
  it('calculates average of all 5 product metrics', () => {
    const scores = { usability: 8, value: 6, features: 7, polish: 5, competition: 4 }
    expect(calculateProductScore(scores)).toBe(6) // (8+6+7+5+4)/5 = 30/5 = 6
  })

  it('ignores null values when calculating average', () => {
    const scores = { usability: 8, value: null, features: 6, polish: 6, competition: null }
    expect(calculateProductScore(scores)).toBeCloseTo(6.67, 1) // (8+6+6)/3
  })

  it('ignores undefined values when calculating average', () => {
    const scores = { usability: 10, value: undefined, features: 8, polish: undefined, competition: undefined }
    expect(calculateProductScore(scores)).toBe(9) // (10+8)/2
  })

  it('returns null when all values are null/undefined', () => {
    expect(calculateProductScore({})).toBeNull()
    expect(calculateProductScore({ usability: null, value: null })).toBeNull()
  })

  it('handles single metric correctly', () => {
    expect(calculateProductScore({ usability: 7 })).toBe(7)
  })

  it('handles edge case scores (1 and 10)', () => {
    const minScores = { usability: 1, value: 1, features: 1, polish: 1, competition: 1 }
    const maxScores = { usability: 10, value: 10, features: 10, polish: 10, competition: 10 }
    expect(calculateProductScore(minScores)).toBe(1)
    expect(calculateProductScore(maxScores)).toBe(10)
  })
})

describe('calculateBusinessScore', () => {
  it('calculates average with inverted maintenance', () => {
    // maintenance: 2 becomes 10-2=8
    const scores = { market: 7, monetization: 6, growth: 5, maintenance: 2 }
    expect(calculateBusinessScore(scores)).toBe(6.5) // (7+6+5+8)/4
  })

  it('correctly inverts maintenance score', () => {
    // maintenance: 10 (worst) inverts to 0
    const worstMaintenance = { market: 5, monetization: 5, growth: 5, maintenance: 10 }
    expect(calculateBusinessScore(worstMaintenance)).toBe(3.75) // (5+5+5+0)/4

    // maintenance: 1 (best) inverts to 9
    const bestMaintenance = { market: 5, monetization: 5, growth: 5, maintenance: 1 }
    expect(calculateBusinessScore(bestMaintenance)).toBe(6) // (5+5+5+9)/4
  })

  it('handles missing maintenance gracefully', () => {
    const scores = { market: 8, monetization: 6, growth: 4 }
    expect(calculateBusinessScore(scores)).toBe(6) // (8+6+4)/3
  })

  it('handles null maintenance', () => {
    const scores = { market: 9, monetization: 9, growth: 9, maintenance: null }
    expect(calculateBusinessScore(scores)).toBe(9) // (9+9+9)/3
  })

  it('returns null when all values are null/undefined', () => {
    expect(calculateBusinessScore({})).toBeNull()
  })
})

describe('calculatePersonalScore', () => {
  it('calculates average of all 3 personal metrics', () => {
    const scores = { passion: 9, learning: 6, pride: 9 }
    expect(calculatePersonalScore(scores)).toBe(8) // (9+6+9)/3
  })

  it('handles partial metrics', () => {
    expect(calculatePersonalScore({ passion: 10 })).toBe(10)
    expect(calculatePersonalScore({ passion: 8, learning: 4 })).toBe(6)
  })

  it('ignores null values', () => {
    const scores = { passion: 10, learning: null, pride: 8 }
    expect(calculatePersonalScore(scores)).toBe(9) // (10+8)/2
  })

  it('returns null when all values are null/undefined', () => {
    expect(calculatePersonalScore({})).toBeNull()
  })
})

describe('calculateOverallScore', () => {
  it('applies correct weights: 50% product, 30% business, 20% personal', () => {
    // All 10s should give 10
    expect(calculateOverallScore(10, 10, 10)).toBe(10)
    // All 5s should give 5
    expect(calculateOverallScore(5, 5, 5)).toBe(5)
  })

  it('calculates weighted average correctly', () => {
    // product: 8*0.5 = 4, business: 6*0.3 = 1.8, personal: 4*0.2 = 0.8
    expect(calculateOverallScore(8, 6, 4)).toBe(6.6)
  })

  it('normalizes weights when product is missing', () => {
    // Only business (0.3) and personal (0.2) = total weight 0.5
    // business: 10*0.3/0.5 = 6, personal: 5*0.2/0.5 = 2
    const result = calculateOverallScore(null, 10, 5)
    expect(result).toBe(8) // 10*0.6 + 5*0.4 = 6 + 2 = 8
  })

  it('normalizes weights when business is missing', () => {
    // Only product (0.5) and personal (0.2) = total weight 0.7
    const result = calculateOverallScore(7, null, 5)
    // 7 * (0.5/0.7) + 5 * (0.2/0.7) = 7*0.714 + 5*0.286 = 5 + 1.43 = 6.43
    expect(result).toBeCloseTo(6.43, 1)
  })

  it('normalizes weights when personal is missing', () => {
    // Only product (0.5) and business (0.3) = total weight 0.8
    const result = calculateOverallScore(8, 6, null)
    // 8 * (0.5/0.8) + 6 * (0.3/0.8) = 8*0.625 + 6*0.375 = 5 + 2.25 = 7.25
    expect(result).toBe(7.25)
  })

  it('returns single score when only one category exists', () => {
    expect(calculateOverallScore(7, null, null)).toBe(7)
    expect(calculateOverallScore(null, 8, null)).toBe(8)
    expect(calculateOverallScore(null, null, 9)).toBe(9)
  })

  it('returns null when all scores are null', () => {
    expect(calculateOverallScore(null, null, null)).toBeNull()
  })
})

describe('calculateRecommendation', () => {
  describe('INVEST recommendation', () => {
    it('recommends INVEST when value >= 7 AND businessScore >= 7', () => {
      const scores = { value: 7, market: 8, monetization: 7, growth: 8, maintenance: 2 }
      expect(calculateRecommendation(scores)).toBe('invest')
    })

    it('recommends INVEST at exact boundary (value=7, business=7)', () => {
      // business score needs to be >= 7 after maintenance inversion
      // market: 7, monetization: 7, growth: 7, maintenance: 3 (inverted: 7)
      // average: (7+7+7+7)/4 = 7
      const scores = { value: 7, market: 7, monetization: 7, growth: 7, maintenance: 3 }
      expect(calculateRecommendation(scores)).toBe('invest')
    })

    it('does NOT recommend INVEST when value is just below 7', () => {
      const scores = { value: 6, market: 8, monetization: 8, growth: 8, maintenance: 1 }
      expect(calculateRecommendation(scores)).not.toBe('invest')
    })

    it('does NOT recommend INVEST when business score is below 7', () => {
      const scores = { value: 8, market: 5, monetization: 5, growth: 5, maintenance: 5 }
      expect(calculateRecommendation(scores)).not.toBe('invest')
    })
  })

  describe('DROP recommendation', () => {
    it('recommends DROP when value <= 4', () => {
      expect(calculateRecommendation({ value: 4 })).toBe('drop')
      expect(calculateRecommendation({ value: 3 })).toBe('drop')
      expect(calculateRecommendation({ value: 1 })).toBe('drop')
    })

    it('recommends DROP when value is exactly 4', () => {
      const scores = { value: 4, usability: 10, features: 10, polish: 10 }
      expect(calculateRecommendation(scores)).toBe('drop')
    })

    it('recommends DROP when maintenance >= 7 AND productScore < 6', () => {
      // productScore = average of usability, value, features, polish, competition
      // (5+5+5+5+5)/5 = 5 < 6
      const scores = {
        usability: 5, value: 5, features: 5, polish: 5, competition: 5,
        maintenance: 7
      }
      expect(calculateRecommendation(scores)).toBe('drop')
    })

    it('does NOT recommend DROP when maintenance >= 7 but productScore >= 6', () => {
      const scores = {
        usability: 7, value: 6, features: 6, polish: 6, competition: 5,
        maintenance: 8
      }
      // productScore = (7+6+6+6+5)/5 = 6
      expect(calculateRecommendation(scores)).not.toBe('drop')
    })
  })

  describe('KEEP recommendation', () => {
    it('recommends KEEP when value >= 5 AND maintenance <= 4', () => {
      const scores = { value: 6, maintenance: 3 }
      expect(calculateRecommendation(scores)).toBe('keep')
    })

    it('recommends KEEP at exact boundaries (value=5, maintenance=4)', () => {
      const scores = { value: 5, maintenance: 4 }
      expect(calculateRecommendation(scores)).toBe('keep')
    })

    it('does NOT recommend KEEP when maintenance > 4', () => {
      const scores = { value: 6, maintenance: 5 }
      expect(calculateRecommendation(scores)).not.toBe('keep')
    })
  })

  describe('PIVOT recommendation', () => {
    it('recommends PIVOT when productScore >= 6 AND value = 5 AND maintenance > 4', () => {
      // productScore = (8+5+7+6+6)/5 = 6.4, value = 5, maintenance = 6
      // KEEP doesn't apply (maintenance > 4), so PIVOT triggers
      const scores = { usability: 8, value: 5, features: 7, polish: 6, competition: 6, maintenance: 6 }
      expect(calculateRecommendation(scores)).toBe('pivot')
    })

    it('recommends PIVOT for good tech but high maintenance', () => {
      // Good product (avg >= 6), mediocre value (5), high maintenance (7)
      const scores = {
        usability: 7, value: 5, features: 8, polish: 7, competition: 5,
        maintenance: 7
      }
      expect(calculateRecommendation(scores)).toBe('pivot')
    })

    it('returns DROP when value <= 4 (DROP is checked before PIVOT)', () => {
      // Even with good product, value=4 triggers DROP first
      const scores = { usability: 8, value: 4, features: 7, polish: 6, competition: 5 }
      expect(calculateRecommendation(scores)).toBe('drop')
    })

    it('returns KEEP instead of PIVOT when maintenance <= 4', () => {
      // value=5, product good, but low maintenance = KEEP (checked before PIVOT)
      const scores = { usability: 8, value: 5, features: 7, polish: 6, competition: 6, maintenance: 3 }
      expect(calculateRecommendation(scores)).toBe('keep')
    })

    it('returns PAUSE when product is not good enough for PIVOT', () => {
      // value=5, maintenance=6 (not KEEP), but productScore < 6
      const scores = { usability: 5, value: 5, features: 5, polish: 5, competition: 5, maintenance: 6 }
      // productScore = 5, not >= 6, so PIVOT doesn't apply
      expect(calculateRecommendation(scores)).toBe('pause')
    })
  })

  describe('PAUSE recommendation', () => {
    it('recommends PAUSE for uncertain/borderline cases', () => {
      // value: 6, maintenance: 5 - doesn't meet KEEP (maintenance > 4)
      // doesn't meet PIVOT (value > 5)
      const scores = { value: 6, maintenance: 5 }
      expect(calculateRecommendation(scores)).toBe('pause')
    })

    it('recommends PAUSE when product is not good enough for other recommendations', () => {
      // value: 6 (not drop, not invest-level), maintenance: 5 (not keep)
      // product score = 5 (not good enough for PIVOT which needs >= 6)
      const scores = { value: 6, maintenance: 5, usability: 5, features: 5, polish: 5, competition: 5 }
      expect(calculateRecommendation(scores)).toBe('pause')
    })

    it('recommends PAUSE for mediocre value with mediocre maintenance', () => {
      // value: 5, maintenance: 5, no product scores (defaults to null/0)
      // KEEP needs maintenance <= 4, PIVOT needs productScore >= 6
      const scores = { value: 5, maintenance: 5 }
      expect(calculateRecommendation(scores)).toBe('pause')
    })
  })

  describe('edge cases', () => {
    it('handles empty scores object - returns DROP (value defaults to 0)', () => {
      // value ?? 0 = 0, which is <= 4, so returns 'drop'
      expect(calculateRecommendation({})).toBe('drop')
    })

    it('handles default values (value=0, maintenance=5)', () => {
      // value defaults to 0 which is <= 4, so should be drop
      const result = calculateRecommendation({})
      expect(result).toBe('drop')
    })

    it('handles all metrics at boundary values', () => {
      // All 5s - should be KEEP (value >= 5, maintenance <= 4 is false though)
      // Actually maintenance=5 > 4, so it won't be KEEP, will be PAUSE
      const allFives = {
        usability: 5, value: 5, features: 5, polish: 5, competition: 5,
        market: 5, monetization: 5, growth: 5, maintenance: 5,
        passion: 5, learning: 5, pride: 5
      }
      expect(calculateRecommendation(allFives)).toBe('pause')
    })
  })
})

describe('computeAllScores', () => {
  it('computes all scores and recommendation together', () => {
    const input = {
      usability: 8, value: 8, features: 7, polish: 7, competition: 5,
      market: 8, monetization: 7, growth: 7, maintenance: 2,
      passion: 9, learning: 8, pride: 9
    }
    const result = computeAllScores(input)

    expect(result.productScore).toBe(7) // (8+8+7+7+5)/5
    expect(result.businessScore).toBe(7.5) // (8+7+7+8)/4 where maintenance inverts to 8
    expect(result.personalScore).toBeCloseTo(8.67, 1) // (9+8+9)/3
    expect(result.overallScore).toBeGreaterThan(7)
    expect(result.recommendation).toBe('invest')
  })

  it('returns consistent recommendation with computed scores', () => {
    const input = { value: 3, usability: 5, maintenance: 8 }
    const result = computeAllScores(input)

    expect(result.recommendation).toBe('drop') // value <= 4
  })

  it('handles all null scores', () => {
    const result = computeAllScores({})

    expect(result.productScore).toBeNull()
    expect(result.businessScore).toBeNull()
    expect(result.personalScore).toBeNull()
    expect(result.overallScore).toBeNull()
    expect(result.recommendation).toBe('drop') // value defaults to 0
  })
})

describe('recommendationInfo', () => {
  it('has all 5 recommendations defined', () => {
    expect(Object.keys(recommendationInfo)).toHaveLength(5)
    expect(recommendationInfo).toHaveProperty('invest')
    expect(recommendationInfo).toHaveProperty('keep')
    expect(recommendationInfo).toHaveProperty('pivot')
    expect(recommendationInfo).toHaveProperty('pause')
    expect(recommendationInfo).toHaveProperty('drop')
  })

  it('each recommendation has required properties', () => {
    for (const [key, info] of Object.entries(recommendationInfo)) {
      expect(info).toHaveProperty('emoji')
      expect(info).toHaveProperty('label')
      expect(info).toHaveProperty('color')
      expect(info).toHaveProperty('bgColor')
      expect(info).toHaveProperty('description')
    }
  })

  it('labels are uppercase', () => {
    expect(recommendationInfo.invest.label).toBe('INVEST')
    expect(recommendationInfo.drop.label).toBe('DROP')
  })
})

describe('metricDefinitions', () => {
  it('has all 12 metrics defined', () => {
    expect(Object.keys(metricDefinitions)).toHaveLength(12)
  })

  it('has 5 product metrics', () => {
    const productMetrics = Object.entries(metricDefinitions)
      .filter(([_, def]) => def.category === 'product')
    expect(productMetrics).toHaveLength(5)
  })

  it('has 4 business metrics', () => {
    const businessMetrics = Object.entries(metricDefinitions)
      .filter(([_, def]) => def.category === 'business')
    expect(businessMetrics).toHaveLength(4)
  })

  it('has 3 personal metrics', () => {
    const personalMetrics = Object.entries(metricDefinitions)
      .filter(([_, def]) => def.category === 'personal')
    expect(personalMetrics).toHaveLength(3)
  })

  it('maintenance is marked as inverted', () => {
    expect(metricDefinitions.maintenance.inverted).toBe(true)
  })

  it('each metric has hints for 1, 5, and 10', () => {
    for (const [key, def] of Object.entries(metricDefinitions)) {
      expect(def.hints).toHaveProperty('1')
      expect(def.hints).toHaveProperty('5')
      expect(def.hints).toHaveProperty('10')
    }
  })

  it('each metric has improvements array', () => {
    for (const [key, def] of Object.entries(metricDefinitions)) {
      expect(Array.isArray(def.improvements)).toBe(true)
      expect(def.improvements.length).toBeGreaterThan(0)
    }
  })
})
