// Website content scraper for AI evaluation
// Uses Firecrawl for JS-rendered content (SPAs), falls back to plain fetch

import FirecrawlApp from '@mendable/firecrawl-js'

export interface ScrapedContent {
  title: string | null
  metaDescription: string | null
  headings: string[]
  mainContent: string
  hasPricing: boolean
  hasLogin: boolean
  technologies: string[]
  ctas: string[]
  hasSocialProof: boolean
  hasSecurityBadges: boolean
  hasVideo: boolean
  hasFaq: boolean
  error: string | null
}

// Empty result helper
function emptyResult(error: string): ScrapedContent {
  return {
    title: null,
    metaDescription: null,
    headings: [],
    mainContent: '',
    hasPricing: false,
    hasLogin: false,
    technologies: [],
    ctas: [],
    hasSocialProof: false,
    hasSecurityBadges: false,
    hasVideo: false,
    hasFaq: false,
    error,
  }
}

// Try Firecrawl first (renders JS for SPAs)
async function scrapeWithFirecrawl(url: string): Promise<ScrapedContent | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.log('FIRECRAWL_API_KEY not set, skipping Firecrawl')
    return null
  }

  try {
    console.log('Scraping with Firecrawl (JS rendering)...')
    const firecrawl = new FirecrawlApp({ apiKey })

    const result = await firecrawl.scrape(url, {
      formats: ['markdown', 'html'],
      timeout: 30000,
    })

    // New API returns document directly, throws on error
    const markdown = result.markdown || ''
    const html = result.html || ''
    const metadata = result.metadata || {}

    console.log(`Firecrawl scraped ${markdown.length} chars`)

    // Extract headings from markdown (# lines)
    const headings: string[] = []
    const headingMatches = markdown.matchAll(/^#{1,3}\s+(.+)$/gm)
    for (const match of headingMatches) {
      const text = match[1].trim()
      if (text && text.length < 200) {
        headings.push(text)
      }
    }

    // Clean markdown content
    let mainContent = markdown
      .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // Remove bold/italic
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\n{3,}/g, '\n\n') // Normalize newlines
      .trim()

    // Limit content length
    if (mainContent.length > 6000) {
      mainContent = mainContent.substring(0, 6000) + '...'
    }

    // Detect features from both markdown and HTML
    const combined = markdown + ' ' + html

    return {
      title: metadata.title || null,
      metaDescription: metadata.description || null,
      headings: headings.slice(0, 20),
      mainContent,
      hasPricing: /pricing|price|cost|subscription|plan|tier|monthly|annually|\$\d+|€\d+|£\d+/i.test(combined),
      hasLogin: /sign\s*in|log\s*in|sign\s*up|create\s*account|register|auth/i.test(combined),
      technologies: detectTechnologies(html),
      ctas: extractCtas(html),
      hasSocialProof: /testimonial|review|customer|client|trusted\s+by|used\s+by|companies\s+use|loved\s+by|\d+\s*\+?\s*(?:users|customers|companies)|rating|stars/i.test(combined),
      hasSecurityBadges: /ssl|secure|encrypted|pci\s*compliant|gdpr|soc\s*2|256[\-\s]?bit|https|verified|trust(?:ed)?[\s\-]?(?:site|badge|seal)/i.test(combined),
      hasVideo: /youtube\.com|vimeo\.com|<video|wistia\.com|loom\.com/i.test(combined),
      hasFaq: /faq|frequently\s+asked|common\s+questions/i.test(combined),
      error: null,
    }
  } catch (error) {
    console.error('Firecrawl error:', error)
    return null
  }
}

// Fallback: plain fetch (doesn't render JS)
async function scrapeWithFetch(url: string): Promise<ScrapedContent> {
  try {
    console.log('Scraping with plain fetch (no JS rendering)...')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AppRater/1.0; +https://apprater.app)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return emptyResult(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    return parseHtml(html)
  } catch (error) {
    return emptyResult(error instanceof Error ? error.message : 'Failed to fetch website')
  }
}

// Main scrape function - tries Firecrawl first, falls back to fetch
export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  // Try Firecrawl first (renders JS)
  const firecrawlResult = await scrapeWithFirecrawl(url)
  if (firecrawlResult) {
    return firecrawlResult
  }

  // Fall back to plain fetch
  return scrapeWithFetch(url)
}

// Detect technologies from HTML
function detectTechnologies(html: string): string[] {
  const technologies: string[] = []
  if (html.includes('__NEXT_DATA__') || html.includes('_next/')) technologies.push('Next.js')
  if (html.includes('__NUXT__') || html.includes('/_nuxt/')) technologies.push('Nuxt')
  if (html.includes('data-reactroot') || html.includes('__REACT_')) technologies.push('React')
  if (html.includes('ng-app') || html.includes('ng-controller')) technologies.push('Angular')
  if (html.includes('data-v-') || html.includes('Vue.js')) technologies.push('Vue')
  if (html.includes('data-svelte')) technologies.push('Svelte')
  if (html.includes('shopify') || html.includes('Shopify')) technologies.push('Shopify')
  if (html.includes('wordpress') || html.includes('wp-content')) technologies.push('WordPress')
  if (html.includes('stripe')) technologies.push('Stripe')
  if (html.includes('intercom')) technologies.push('Intercom')
  if (html.includes('google-analytics') || html.includes('gtag')) technologies.push('Google Analytics')
  return technologies
}

// Extract CTAs from HTML
function extractCtas(html: string): string[] {
  const ctas: string[] = []
  const buttonMatches = html.matchAll(/<button[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/button>/gi)
  for (const match of buttonMatches) {
    const text = stripHtml(match[1]).trim()
    if (text && text.length < 50 && text.length > 1) {
      ctas.push(text)
    }
  }
  const ctaLinkMatches = html.matchAll(/<a[^>]*(?:class=["'][^"']*(?:btn|button|cta)[^"']*["'])[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi)
  for (const match of ctaLinkMatches) {
    const text = stripHtml(match[1]).trim()
    if (text && text.length < 50 && text.length > 1) {
      ctas.push(text)
    }
  }
  return ctas.slice(0, 10)
}

// Parse HTML and extract relevant content (used by fetch fallback)
function parseHtml(html: string): ScrapedContent {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null

  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
  const metaDescription = metaDescMatch ? decodeHtmlEntities(metaDescMatch[1].trim()) : null

  const headingMatches = html.matchAll(/<h[123][^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/h[123]>/gi)
  const headings: string[] = []
  for (const match of headingMatches) {
    const text = stripHtml(match[1]).trim()
    if (text && text.length < 200) {
      headings.push(text)
    }
  }

  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  const mainMatch = cleanHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || cleanHtml.match(/<div[^>]*(?:id|class)=["'][^"']*(?:content|main|app)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)

  const contentHtml = mainMatch ? mainMatch[1] : cleanHtml

  let mainContent = stripHtml(contentHtml)
  mainContent = mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  if (mainContent.length > 6000) {
    mainContent = mainContent.substring(0, 6000) + '...'
  }

  return {
    title,
    metaDescription,
    headings: headings.slice(0, 20),
    mainContent,
    hasPricing: /pricing|price|cost|subscription|plan|tier|monthly|annually|\$\d+|€\d+|£\d+/i.test(html),
    hasLogin: /sign\s*in|log\s*in|sign\s*up|create\s*account|register|auth/i.test(html),
    technologies: detectTechnologies(html),
    ctas: extractCtas(html),
    hasSocialProof: /testimonial|review|customer|client|trusted\s+by|used\s+by|companies\s+use|loved\s+by|\d+\s*\+?\s*(?:users|customers|companies)|rating|stars/i.test(html),
    hasSecurityBadges: /ssl|secure|encrypted|pci\s*compliant|gdpr|soc\s*2|256[\-\s]?bit|https|verified|trust(?:ed)?[\s\-]?(?:site|badge|seal)/i.test(html),
    hasVideo: /youtube\.com|vimeo\.com|<video|wistia\.com|loom\.com/i.test(html),
    hasFaq: /faq|frequently\s+asked|common\s+questions/i.test(html),
    error: null,
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
}
