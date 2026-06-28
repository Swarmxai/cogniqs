import { test, expect } from '@playwright/test'
import { DEMO_EMAIL, DEMO_PASSWORD } from './helpers.js'

test.describe('Authentication', () => {
  test('demo user can sign in and reach dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('login-email').fill(DEMO_EMAIL)
    await page.getByTestId('login-password').fill(DEMO_PASSWORD)
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Welcome back to')).toBeVisible()
  })
})
