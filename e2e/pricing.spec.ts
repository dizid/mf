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

test.describe('Pricing Page', () => {
  test.skip(skipIfNoAuth, 'Requires APP_PASSWORD env var')

  test.beforeEach(async ({ page }) => {
    await login(page)
  })
  test('displays free and pro tiers', async ({ page }) => {
    await page.goto('/pricing')

    // Check for Free tier
    await expect(page.getByText('Free')).toBeVisible()
    await expect(page.getByText('$0')).toBeVisible()

    // Check for Pro tier
    await expect(page.getByText('Pro')).toBeVisible()
    await expect(page.getByText('$9')).toBeVisible()
  })

  test('shows correct free tier limits', async ({ page }) => {
    await page.goto('/pricing')

    // Free tier should show 3 projects limit
    await expect(page.getByText(/3 projects/i)).toBeVisible()
  })

  test('shows correct pro tier limits', async ({ page }) => {
    await page.goto('/pricing')

    // Pro tier should show 25 projects limit
    await expect(page.getByText(/25 projects/i)).toBeVisible()
  })

  test('has upgrade button for pro tier', async ({ page }) => {
    await page.goto('/pricing')

    // Should have a button/link to upgrade
    const upgradeButton = page.getByRole('button', { name: /upgrade|get pro|subscribe/i })
    await expect(upgradeButton).toBeVisible()
  })

  test('pricing cards are responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/pricing')

    // Both pricing tiers should be visible
    await expect(page.getByText('Free')).toBeVisible()
    await expect(page.getByText('Pro')).toBeVisible()
  })
})
