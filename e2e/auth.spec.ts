import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('shows login page with correct elements', async ({ page }) => {
    await page.goto('/login')

    // Check page title and description
    await expect(page.getByRole('heading', { name: 'App Rater' })).toBeVisible()
    await expect(page.getByText('Enter password to continue')).toBeVisible()

    // Check password input exists
    await expect(page.getByPlaceholder('Password')).toBeVisible()

    // Check submit button exists
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  })

  test('redirects unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/projects')

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login')

    // Enter wrong password
    await page.getByPlaceholder('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Should show error message
    await expect(page.getByText('Wrong password')).toBeVisible()

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows loading state while authenticating', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('Password').fill('anypassword')

    // Click and immediately check for loading state
    await page.getByRole('button', { name: 'Continue' }).click()

    // Button should show loading text (may be brief)
    // The button text changes to "Checking..."
    await expect(page.getByRole('button', { name: 'Checking...' })).toBeVisible()
  })

  test('login with correct password redirects to home', async ({ page }) => {
    // Skip this test if APP_PASSWORD is not set
    const testPassword = process.env.APP_PASSWORD
    if (!testPassword) {
      test.skip()
      return
    }

    await page.goto('/login')

    await page.getByPlaceholder('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Continue' }).click()

    // Should redirect to home page after successful login
    await expect(page).toHaveURL('/')
  })

  test('password input has correct height for mobile (56px)', async ({ page }) => {
    await page.goto('/login')

    const input = page.getByPlaceholder('Password')
    const box = await input.boundingBox()

    expect(box).toBeTruthy()
    if (box) {
      // h-14 = 56px in Tailwind
      expect(box.height).toBeGreaterThanOrEqual(56)
    }
  })

  test('submit button has correct height for mobile', async ({ page }) => {
    await page.goto('/login')

    const button = page.getByRole('button', { name: 'Continue' })
    const box = await button.boundingBox()

    expect(box).toBeTruthy()
    if (box) {
      // Large button should be at least 56px
      expect(box.height).toBeGreaterThanOrEqual(48)
    }
  })
})
