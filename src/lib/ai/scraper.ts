// Website content scraper for AI evaluation

export interface ScrapedContent {
  title: string | null
  metaDescription: string | null
  headings: string[]
  mainContent: string
  hasPricing: boolean
  hasLogin: boolean
  technologies: string[]
  // UX signal detection
  ctas: string[]
  hasSocialProof: boolean
  hasSecurityBadges: boolean
  hasVideo: boolean
  hasFaq: boolean
  error: string | null
}

// Fetch and extract content from a URL
export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  try {
    // Fetch the page with a reasonable timeout
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
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const html = await response.text()
    return parseHtml(html)
  } catch (error) {
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
      error: error instanceof Error ? error.message : 'Failed to fetch website',
    }
  }
}

// Parse HTML and extract relevant content
function parseHtml(html: string): ScrapedContent {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
  const metaDescription = metaDescMatch ? decodeHtmlEntities(metaDescMatch[1].trim()) : null

  // Extract headings (h1, h2, h3)
  const headingMatches = html.matchAll(/<h[123][^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/h[123]>/gi)
  const headings: string[] = []
  for (const match of headingMatches) {
    const text = stripHtml(match[1]).trim()
    if (text && text.length < 200) {
      headings.push(text)
    }
  }

  // Remove script, style, nav, footer, header tags for main content
  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // Extract main content area if present
  const mainMatch = cleanHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || cleanHtml.match(/<div[^>]*(?:id|class)=["'][^"']*(?:content|main|app)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)

  const contentHtml = mainMatch ? mainMatch[1] : cleanHtml

  // Strip HTML tags and clean up whitespace
  let mainContent = stripHtml(contentHtml)
  mainContent = mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  // Limit content length for API
  if (mainContent.length > 6000) {
    mainContent = mainContent.substring(0, 6000) + '...'
  }

  // Detect pricing indicators
  const pricingKeywords = /pricing|price|cost|subscription|plan|tier|monthly|annually|\$\d+|€\d+|£\d+/i
  const hasPricing = pricingKeywords.test(html)

  // Detect login/auth indicators
  const loginKeywords = /sign\s*in|log\s*in|sign\s*up|create\s*account|register|auth/i
  const hasLogin = loginKeywords.test(html)

  // Detect technologies from common patterns
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

  // Extract CTAs (buttons and prominent links)
  const ctas: string[] = []
  const buttonMatches = html.matchAll(/<button[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/button>/gi)
  for (const match of buttonMatches) {
    const text = stripHtml(match[1]).trim()
    if (text && text.length < 50 && text.length > 1) {
      ctas.push(text)
    }
  }
  // Also check for links with CTA-like classes
  const ctaLinkMatches = html.matchAll(/<a[^>]*(?:class=["'][^"']*(?:btn|button|cta)[^"']*["'])[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi)
  for (const match of ctaLinkMatches) {
    const text = stripHtml(match[1]).trim()
    if (text && text.length < 50 && text.length > 1) {
      ctas.push(text)
    }
  }

  // Detect social proof (testimonials, reviews, customer logos)
  const socialProofKeywords = /testimonial|review|customer|client|trusted\s+by|used\s+by|companies\s+use|loved\s+by|\d+\s*\+?\s*(?:users|customers|companies)|rating|stars/i
  const hasSocialProof = socialProofKeywords.test(html)

  // Detect security badges
  const securityKeywords = /ssl|secure|encrypted|pci\s*compliant|gdpr|soc\s*2|256[\-\s]?bit|https|verified|trust(?:ed)?[\s\-]?(?:site|badge|seal)/i
  const hasSecurityBadges = securityKeywords.test(html)

  // Detect video embeds
  const hasVideo = /youtube\.com|vimeo\.com|<video|wistia\.com|loom\.com/i.test(html)

  // Detect FAQ section
  const hasFaq = /faq|frequently\s+asked|common\s+questions/i.test(html)

  return {
    title,
    metaDescription,
    headings: headings.slice(0, 20), // Limit to 20 headings
    mainContent,
    hasPricing,
    hasLogin,
    technologies,
    ctas: ctas.slice(0, 10), // Limit to 10 CTAs
    hasSocialProof,
    hasSecurityBadges,
    hasVideo,
    hasFaq,
    error: null,
  }
}

// Strip HTML tags from string
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

// Decode HTML entities
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
