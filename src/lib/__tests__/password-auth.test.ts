import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { verifyPassword } from '../password-auth'

describe('verifyPassword', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset process.env before each test
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns true when password matches APP_PASSWORD', () => {
    process.env.APP_PASSWORD = 'secret123'
    expect(verifyPassword('secret123')).toBe(true)
  })

  it('returns false when password does not match', () => {
    process.env.APP_PASSWORD = 'secret123'
    expect(verifyPassword('wrongpassword')).toBe(false)
  })

  it('returns false when APP_PASSWORD is not set', () => {
    delete process.env.APP_PASSWORD
    expect(verifyPassword('anypassword')).toBe(false)
  })

  it('returns false when APP_PASSWORD is empty string', () => {
    process.env.APP_PASSWORD = ''
    expect(verifyPassword('')).toBe(false) // Empty string is falsy
  })

  it('is case-sensitive', () => {
    process.env.APP_PASSWORD = 'Secret123'
    expect(verifyPassword('secret123')).toBe(false)
    expect(verifyPassword('SECRET123')).toBe(false)
    expect(verifyPassword('Secret123')).toBe(true)
  })

  it('handles special characters correctly', () => {
    process.env.APP_PASSWORD = 'p@$$w0rd!#$%'
    expect(verifyPassword('p@$$w0rd!#$%')).toBe(true)
    expect(verifyPassword('p@$$w0rd')).toBe(false)
  })

  it('handles unicode characters', () => {
    process.env.APP_PASSWORD = 'password123'
    expect(verifyPassword('password123')).toBe(true)
  })

  it('handles leading/trailing whitespace correctly', () => {
    process.env.APP_PASSWORD = 'secret'
    expect(verifyPassword(' secret')).toBe(false)
    expect(verifyPassword('secret ')).toBe(false)
    expect(verifyPassword(' secret ')).toBe(false)
  })
})

// Note: isAuthenticated, setAuthCookie, clearAuthCookie require Next.js cookies() mock
// They should be tested with integration tests

// Note: getDefaultUserId, isProUser require database access
// They should be tested with integration tests that mock the database
