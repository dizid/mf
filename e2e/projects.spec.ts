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

test.describe('Projects Page', () => {
  test.skip(skipIfNoAuth, 'Requires APP_PASSWORD env var')

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('displays projects page', async ({ page }) => {
    await page.goto('/projects')

    // Should show projects heading or empty state
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible()
  })

  test('has add project button', async ({ page }) => {
    await page.goto('/projects')

    // Should have a way to add a project
    const addButton = page.getByRole('link', { name: /add|new|create/i }).or(
      page.getByRole('button', { name: /add|new|create/i })
    )
    await expect(addButton).toBeVisible()
  })

  test('can navigate to new project page', async ({ page }) => {
    await page.goto('/projects/new')

    // Should be on new project page
    await expect(page).toHaveURL(/\/projects\/new/)

    // Should have form elements
    await expect(page.getByPlaceholder(/name/i)).toBeVisible()
    await expect(page.getByPlaceholder(/url/i)).toBeVisible()
  })
})

test.describe('Create Project Flow', () => {
  test.skip(skipIfNoAuth, 'Requires APP_PASSWORD env var')

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('new project form has required fields', async ({ page }) => {
    await page.goto('/projects/new')

    // Should have name field
    await expect(page.getByPlaceholder(/name/i)).toBeVisible()

    // Should have URL field
    await expect(page.getByPlaceholder(/url/i)).toBeVisible()

    // Should have submit button
    await expect(page.getByRole('button', { name: /create|add|save/i })).toBeVisible()
  })

  test('form validates required fields', async ({ page }) => {
    await page.goto('/projects/new')

    // Try to submit empty form
    await page.getByRole('button', { name: /create|add|save/i }).click()

    // Should show validation error or stay on page
    await expect(page).toHaveURL(/\/projects\/new/)
  })

  test('form input heights are mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/projects/new')

    const nameInput = page.getByPlaceholder(/name/i)
    const box = await nameInput.boundingBox()

    if (box) {
      // Inputs should be at least 48px for easy tapping
      expect(box.height).toBeGreaterThanOrEqual(48)
    }
  })
})
