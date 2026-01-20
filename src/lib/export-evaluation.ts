import type { Evaluation, Project, EvaluationNotes } from './db/schema'
import { recommendationInfo, metricDefinitions, type MetricKey } from './scoring'

/**
 * Formats an evaluation as markdown for AI assistants to analyze
 */
export function formatEvaluationForAI(
  evaluation: Evaluation,
  project: Pick<Project, 'name' | 'url' | 'description'>
): string {
  const rec = evaluation.recommendation
    ? recommendationInfo[evaluation.recommendation as keyof typeof recommendationInfo]
    : null

  const notes = evaluation.notes as EvaluationNotes | null

  // Format date
  const dateStr = new Date(evaluation.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Build metric details
  const productDetails = [
    `Usability: ${evaluation.scoreUsability ?? '-'}`,
    `Value: ${evaluation.scoreValue ?? '-'}`,
    `Features: ${evaluation.scoreFeatures ?? '-'}`,
    `Polish: ${evaluation.scorePolish ?? '-'}`,
    `Competition: ${evaluation.scoreCompetition ?? '-'}`,
  ].join(', ')

  const businessDetails = [
    `Market: ${evaluation.scoreMarket ?? '-'}`,
    `Monetization: ${evaluation.scoreMonetization ?? '-'}`,
    `Maintenance: ${evaluation.scoreMaintenance ?? '-'} (low=good)`,
    `Growth: ${evaluation.scoreGrowth ?? '-'}`,
  ].join(', ')

  const personalDetails = [
    `Passion: ${evaluation.scorePassion ?? '-'}`,
    `Learning: ${evaluation.scoreLearning ?? '-'}`,
    `Pride: ${evaluation.scorePride ?? '-'}`,
  ].join(', ')

  // Find weak areas (scores <= 4, or maintenance >= 7)
  const weakAreas: string[] = []
  const metrics: Array<{ key: MetricKey; field: keyof Evaluation; inverted?: boolean }> = [
    { key: 'usability', field: 'scoreUsability' },
    { key: 'value', field: 'scoreValue' },
    { key: 'features', field: 'scoreFeatures' },
    { key: 'polish', field: 'scorePolish' },
    { key: 'competition', field: 'scoreCompetition' },
    { key: 'market', field: 'scoreMarket' },
    { key: 'monetization', field: 'scoreMonetization' },
    { key: 'maintenance', field: 'scoreMaintenance', inverted: true },
    { key: 'growth', field: 'scoreGrowth' },
    { key: 'passion', field: 'scorePassion' },
    { key: 'learning', field: 'scoreLearning' },
    { key: 'pride', field: 'scorePride' },
  ]

  for (const { key, field, inverted } of metrics) {
    const score = evaluation[field] as number | null
    if (score === null) continue

    const def = metricDefinitions[key]
    const isWeak = inverted ? score >= 7 : score <= 4

    if (isWeak) {
      const note = notes?.[key]
      const suffix = inverted ? ' (too high - lower is better)' : ''
      weakAreas.push(`- **${def.label}:** ${score}/10${suffix}${note ? ` - "${note}"` : ''}`)
    }
  }

  // Collect notes for non-weak areas
  const otherNotes: string[] = []
  for (const { key, field, inverted } of metrics) {
    const score = evaluation[field] as number | null
    const note = notes?.[key]
    if (!note) continue

    const isWeak = inverted ? (score ?? 0) >= 7 : (score ?? 10) <= 4
    if (!isWeak) {
      const def = metricDefinitions[key]
      otherNotes.push(`- **${def.label}:** "${note}"`)
    }
  }

  // Build markdown
  let md = `# Project Evaluation: ${project.name}

**URL:** ${project.url}
${project.description ? `**Description:** ${project.description}\n` : ''}**Evaluated:** ${dateStr}
${rec ? `**Recommendation:** ${rec.emoji} ${rec.label} - ${rec.description}` : ''}

## Scores

**Overall Score:** ${evaluation.overallScore ? Number(evaluation.overallScore).toFixed(1) : '-'}/10

| Category | Score | Individual Metrics |
|----------|-------|-------------------|
| Product Quality | ${evaluation.productScore ? Number(evaluation.productScore).toFixed(1) : '-'}/10 | ${productDetails} |
| Business Viability | ${evaluation.businessScore ? Number(evaluation.businessScore).toFixed(1) : '-'}/10 | ${businessDetails} |
| Personal Investment | ${evaluation.personalScore ? Number(evaluation.personalScore).toFixed(1) : '-'}/10 | ${personalDetails} |

### Scoring Weights
- Product Quality: 50% of overall score
- Business Viability: 30% of overall score
- Personal Investment: 20% of overall score
`

  if (weakAreas.length > 0) {
    md += `
## Weak Areas (need improvement)
${weakAreas.join('\n')}
`
  }

  if (otherNotes.length > 0) {
    md += `
## Notes
${otherNotes.join('\n')}
`
  }

  md += `
---

Based on this evaluation data, please suggest 3-5 specific, actionable improvements that would have the highest impact on increasing the overall score. Focus especially on the weak areas identified above.
`

  return md
}
