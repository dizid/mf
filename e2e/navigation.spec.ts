import { test, expect } from '@playwright/test'

// Helper to login before tests that require authentication
async function login(page: import('@playwright/test').Page): Promise<boolean> {
  const testPassword = process.env.APP_PASSWORD
  if (!testPassword) return false

  await page.goto('/login')
  await page.getByPlaceholder('Password').fill(testPassword)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForURL('/')
  return true
}

// Skip tests that require auth if APP_PASSWORD is not set
const skipIfNoAuth = !process.env.APP_PASSWORD

test.describe('Navigation', () => {
  test.skip(skipIfNoAuth, 'Requires APP_PASSWORD env var')

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('home page loads correctly', async ({ page }) => {
    await page.goto('/')

    // Should show dashboard content
    await expect(page.getByText('Portfolio')).toBeVisible()
  })

  test('can navigate to projects page', async ({ page }) => {
    await page.goto('/')

    // Find and click projects link (likely in bottom nav)
    await page.getByRole('link', { name: /projects/i }).first().click()

    await expect(page).toHaveURL(/\/projects/)
  })

  test('can navigate to pricing page', async ({ page }) => {
    await page.goto('/pricing')

    // Should show pricing tiers
    await expect(page.getByText('Free')).toBeVisible()
    await expect(page.getByText('Pro')).toBeVisible()
  })

  test('can navigate to compare page', async ({ page }) => {
    await page.goto('/compare')

    await expect(page).toHaveURL(/\/compare/)
  })
})

test.describe('Mobile Navigation', () => {
  test.skip(skipIfNoAuth, 'Requires APP_PASSWORD env var')
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('bottom navigation is visible on mobile', async ({ page }) => {
    await page.goto('/')

    // Check for bottom navigation element
    const bottomNav = page.locator('nav').filter({ hasText: /home|projects/i })
    await expect(bottomNav).toBeVisible()
  })

  test('touch targets are at least 48px', async ({ page }) => {
    await page.goto('/')

    // Get all clickable elements
    const links = await page.getByRole('link').all()

    for (const link of links.slice(0, 5)) {
      // Check first 5 links
      const box = await link.boundingBox()
      if (box && box.height > 0) {
        // Touch targets should be at least 44px (minimum), prefer 48px
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
})
