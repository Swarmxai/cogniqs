import { test, expect } from '@playwright/test'
import { login } from './helpers.js'

test.describe('Command palette', () => {
  test('opens with Cmd+K and navigates to a page', async ({ page }) => {
    await login(page)

    // Ensure the layout (and its key listener) is mounted before pressing
    await expect(page.getByRole('button', { name: 'Open command palette' }).first()).toBeVisible()
    await page.keyboard.press('ControlOrMeta+KeyK')
    const input = page.getByPlaceholder('Search pages and actions…')
    await expect(input).toBeVisible()

    await input.fill('knowledge')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/vectors')
    await expect(input).toBeHidden()
  })

  test('opens from the header search trigger and closes with Escape', async ({ page }) => {
    await login(page)

    await page.getByRole('button', { name: 'Open command palette' }).first().click()
    const input = page.getByPlaceholder('Search pages and actions…')
    await expect(input).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(input).toBeHidden()
  })
})
