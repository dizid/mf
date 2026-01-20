import { describe, it, expect } from 'vitest'
import { TIERS } from '../stripe'

describe('TIERS configuration', () => {
  describe('free tier', () => {
    it('has correct name and price', () => {
      expect(TIERS.free.name).toBe('Free')
      expect(TIERS.free.price).toBe(0)
      expect(TIERS.free.priceId).toBeNull()
    })

    it('has correct project limits', () => {
      expect(TIERS.free.limits.projects).toBe(3)
    })

    it('has correct evaluation limits', () => {
      expect(TIERS.free.limits.evaluationsPerProject).toBe(5)
    })

    it('has correct compare limit', () => {
      expect(TIERS.free.limits.compareProjects).toBe(2)
    })

    it('has features array', () => {
      expect(Array.isArray(TIERS.free.features)).toBe(true)
      expect(TIERS.free.features.length).toBeGreaterThan(0)
    })
  })

  describe('pro tier', () => {
    it('has correct name and price', () => {
      expect(TIERS.pro.name).toBe('Pro')
      expect(TIERS.pro.price).toBe(9)
    })

    it('has correct project limits (25)', () => {
      expect(TIERS.pro.limits.projects).toBe(25)
    })

    it('has unlimited evaluations', () => {
      expect(TIERS.pro.limits.evaluationsPerProject).toBe(Infinity)
    })

    it('has correct compare limit (10)', () => {
      expect(TIERS.pro.limits.compareProjects).toBe(10)
    })

    it('has more features than free tier', () => {
      expect(TIERS.pro.features.length).toBeGreaterThan(TIERS.free.features.length)
    })
  })

  describe('tier comparisons', () => {
    it('pro has more projects than free', () => {
      expect(TIERS.pro.limits.projects).toBeGreaterThan(TIERS.free.limits.projects)
    })

    it('pro has more/equal evaluations than free', () => {
      expect(TIERS.pro.limits.evaluationsPerProject).toBeGreaterThan(TIERS.free.limits.evaluationsPerProject)
    })

    it('pro has more compare slots than free', () => {
      expect(TIERS.pro.limits.compareProjects).toBeGreaterThan(TIERS.free.limits.compareProjects)
    })

    it('pro costs more than free', () => {
      expect(TIERS.pro.price).toBeGreaterThan(TIERS.free.price)
    })
  })
})
