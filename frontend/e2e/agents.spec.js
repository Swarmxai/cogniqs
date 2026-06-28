import { test, expect } from '@playwright/test'
import { login } from './helpers.js'

test.describe('AI Agents', () => {
  test('create text agent and chat', async ({ page }) => {
    const agentName = `E2E Agent ${Date.now()}`

    await login(page)
    await page.goto('/agents')
    await page.getByTestId('agent-new').click()
    await page.getByRole('button', { name: 'Text Agent' }).click()
    await page.getByTestId('agent-name').fill(agentName)
    await page.getByTestId('agent-create-submit').click()

    await page.getByRole('button', { name: agentName }).click()
    await page.getByTestId('agent-chat-input').fill('Say exactly: pong')
    await page.getByTestId('agent-chat-send').click()

    await expect(page.locator('.cq-surface-2').filter({ hasText: /^pong$/i })).toBeVisible({ timeout: 45_000 })
  })

  test('publish agent shows embed URL', async ({ page }) => {
    const agentName = `E2E Publish ${Date.now()}`

    await login(page)
    await page.goto('/agents')
    await page.getByTestId('agent-new').click()
    await page.getByRole('button', { name: 'Text Agent' }).click()
    await page.getByTestId('agent-name').fill(agentName)
    await page.getByTestId('agent-create-submit').click()

    await page.getByRole('button', { name: agentName }).click()
    await page.getByTestId('agent-publish').click()
    await expect(page.getByText('Published agent embed')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('code')).toContainText('/embed/agents/')
  })
})
