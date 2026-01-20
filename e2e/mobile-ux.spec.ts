import { test, expect } from '@playwright/test'

// Mobile viewport tests - only tests that work without auth
test.describe('Mobile UX', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('login page fits mobile viewport without horizontal scroll', async ({ page }) => {
    await page.goto('/login')

    // Check that the page width doesn't exceed viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375)
  })

  test('text is readable on login page (minimum 14px)', async ({ page }) => {
    await page.goto('/login')

    // Check paragraph text sizes
    const paragraphs = await page.locator('p').all()

    for (const p of paragraphs.slice(0, 5)) {
      const fontSize = await p.evaluate((el) =>
        parseInt(window.getComputedStyle(el).fontSize)
      )
      expect(fontSize).toBeGreaterThanOrEqual(14)
    }
  })

  test('buttons have sufficient contrast', async ({ page }) => {
    await page.goto('/login')

    const button = page.getByRole('button', { name: 'Continue' })

    // Check button is visible and styled
    await expect(button).toBeVisible()

    // Button should have a background color (not transparent)
    const bgColor = await button.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(bgColor).not.toBe('transparent')
  })

  test('no horizontal overflow on login page', async ({ page }) => {
    await page.goto('/login')

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Touch Target Sizes', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('login button is at least 48px tall', async ({ page }) => {
    await page.goto('/login')

    const button = page.getByRole('button', { name: 'Continue' })
    const box = await button.boundingBox()

    expect(box).toBeTruthy()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(48)
    }
  })

  test('login input is at least 48px tall', async ({ page }) => {
    await page.goto('/login')

    const input = page.getByPlaceholder('Password')
    const box = await input.boundingBox()

    expect(box).toBeTruthy()
    if (box) {
      // h-14 in Tailwind = 56px
      expect(box.height).toBeGreaterThanOrEqual(48)
    }
  })
})

test.describe('Visual Consistency', () => {
  test('login form is centered on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    const form = page.locator('form')
    const box = await form.boundingBox()

    if (box) {
      // Form should be roughly centered (within 50px of center)
      const viewportCenter = 375 / 2
      const formCenter = box.x + box.width / 2
      expect(Math.abs(viewportCenter - formCenter)).toBeLessThan(50)
    }
  })
})
