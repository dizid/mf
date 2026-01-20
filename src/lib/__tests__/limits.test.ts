import { describe, it, expect } from 'vitest'
import { getUpgradeMessage } from '../limits'

// Note: getUserLimits, canCreateProject, and canCreateEvaluation require database
// They should be tested with integration tests that mock the database

describe('getUpgradeMessage', () => {
  it('returns correct message for projects limit', () => {
    const message = getUpgradeMessage('projects')
    expect(message).toContain('project limit')
    expect(message).toContain('Pro')
  })

  it('returns correct message for evaluations limit', () => {
    const message = getUpgradeMessage('evaluations')
    expect(message).toContain('evaluation limit')
    expect(message).toContain('Upgrade')
  })

  it('returns correct message for compare limit', () => {
    const message = getUpgradeMessage('compare')
    expect(message).toContain('compare')
    expect(message).toContain('Upgrade')
  })

  it('returns different messages for different limit types', () => {
    const projectsMsg = getUpgradeMessage('projects')
    const evaluationsMsg = getUpgradeMessage('evaluations')
    const compareMsg = getUpgradeMessage('compare')

    expect(projectsMsg).not.toBe(evaluationsMsg)
    expect(evaluationsMsg).not.toBe(compareMsg)
    expect(projectsMsg).not.toBe(compareMsg)
  })
})
