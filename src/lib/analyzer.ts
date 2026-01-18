// Analyzer using PageSpeed Insights API (free, no infra needed)

interface AnalysisResult {
  performance: number | null
  accessibility: number | null
  mobile: number | null
  seo: number | null
  security: number | null
  technical: number | null
  rawData: Record<string, unknown> | null
  issues: {
    category: string
    severity: 'high' | 'medium' | 'low'
    message: string
    recommendation?: string
  }[]
}

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const issues: AnalysisResult['issues'] = []

  // Run PageSpeed Insights for both mobile and desktop
  const [mobileData, desktopData] = await Promise.all([
    fetchPageSpeedData(url, 'mobile'),
    fetchPageSpeedData(url, 'desktop'),
  ])

  // Extract Lighthouse scores (0-100)
  const mobileScores = extractLighthouseScores(mobileData)
  const desktopScores = extractLighthouseScores(desktopData)

  // Mobile score is the average of mobile Lighthouse categories
  // or compare mobile vs desktop performance
  const mobileScore = mobileScores.performance !== null
    ? Math.round((mobileScores.performance + (desktopScores.performance || 0)) / 2 * 0.8 + mobileScores.performance * 0.2)
    : null

  // Extract issues from Lighthouse audits
  const audits = mobileData?.lighthouseResult?.audits || {}

  // Check for common issues
  if (audits['viewport']?.score === 0) {
    issues.push({
      category: 'mobile',
      severity: 'high',
      message: 'Missing viewport meta tag',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">'
    })
  }

  if (audits['tap-targets']?.score !== null && audits['tap-targets']?.score < 0.9) {
    issues.push({
      category: 'mobile',
      severity: 'medium',
      message: 'Touch targets too small',
      recommendation: 'Ensure buttons and links are at least 48x48px'
    })
  }

  if (audits['color-contrast']?.score !== null && audits['color-contrast']?.score < 1) {
    issues.push({
      category: 'accessibility',
      severity: 'high',
      message: 'Insufficient color contrast',
      recommendation: 'Ensure text has at least 4.5:1 contrast ratio'
    })
  }

  if (audits['is-on-https']?.score === 0) {
    issues.push({
      category: 'security',
      severity: 'high',
      message: 'Site not served over HTTPS',
      recommendation: 'Enable HTTPS for your site'
    })
  }

  if (audits['meta-description']?.score === 0) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      message: 'Missing meta description',
      recommendation: 'Add a meta description to improve search visibility'
    })
  }

  if (audits['document-title']?.score === 0) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      message: 'Missing page title',
      recommendation: 'Add a <title> tag to your page'
    })
  }

  // Technical score based on various audits
  const technicalChecks = [
    audits['errors-in-console']?.score ?? 1,
    audits['valid-source-maps']?.score ?? 1,
    audits['no-unload-listeners']?.score ?? 1,
  ]
  const technicalScore = Math.round(
    technicalChecks.reduce((a, b) => a + b, 0) / technicalChecks.length * 100
  )

  // Security score (basic - HTTPS check)
  const securityScore = audits['is-on-https']?.score === 1 ? 100 : 0

  return {
    performance: mobileScores.performance,
    accessibility: mobileScores.accessibility,
    mobile: mobileScore,
    seo: mobileScores.seo,
    security: securityScore,
    technical: technicalScore,
    rawData: { mobile: mobileData, desktop: desktopData },
    issues,
  }
}

async function fetchPageSpeedData(url: string, strategy: 'mobile' | 'desktop') {
  const params = new URLSearchParams()
  params.set('url', url)
  params.set('strategy', strategy)
  params.append('category', 'performance')
  params.append('category', 'accessibility')
  params.append('category', 'seo')
  params.append('category', 'best-practices')

  // Add API key if available (increases quota)
  if (process.env.PAGESPEED_API_KEY) {
    params.set('key', process.env.PAGESPEED_API_KEY)
  }

  try {
    const res = await fetch(`${PAGESPEED_API}?${params}`, {
      next: { revalidate: 0 }, // Don't cache
    })

    if (!res.ok) {
      console.error(`PageSpeed API error: ${res.status}`)
      return null
    }

    return await res.json()
  } catch (error) {
    console.error('PageSpeed fetch error:', error)
    return null
  }
}

function extractLighthouseScores(data: Record<string, unknown> | null): {
  performance: number | null
  accessibility: number | null
  seo: number | null
  bestPractices: number | null
} {
  if (!data) {
    return { performance: null, accessibility: null, seo: null, bestPractices: null }
  }

  const categories = (data as { lighthouseResult?: { categories?: Record<string, { score?: number }> } })
    .lighthouseResult?.categories

  if (!categories) {
    return { performance: null, accessibility: null, seo: null, bestPractices: null }
  }

  return {
    performance: categories.performance?.score != null
      ? Math.round(categories.performance.score * 100)
      : null,
    accessibility: categories.accessibility?.score != null
      ? Math.round(categories.accessibility.score * 100)
      : null,
    seo: categories.seo?.score != null
      ? Math.round(categories.seo.score * 100)
      : null,
    bestPractices: categories['best-practices']?.score != null
      ? Math.round(categories['best-practices'].score * 100)
      : null,
  }
}
