import { test, expect } from '@playwright/test'
import { apiLogin, createWorkflow, login } from './helpers.js'

test.describe('Workflow editor', () => {
  test('build manual trigger + set node workflow and execute', async ({ page, request }) => {
    const token = await apiLogin(request)
    const wf = await createWorkflow(request, token, {
      name: `E2E Set Workflow ${Date.now()}`,
      nodes: [
        {
          id: 't1',
          type: 'manual_trigger',
          position: { x: 0, y: 0 },
          data: { type: 'manual_trigger', label: 'Start', parameters: {} },
        },
        {
          id: 'n1',
          type: 'set_node',
          position: { x: 280, y: 0 },
          data: {
            type: 'set_node',
            label: 'Assign',
            parameters: { fields: '{"greeting": "Hello E2E"}' },
          },
        },
      ],
      connections: [
        { source: 't1', target: 'n1', sourceHandle: 'main-out', targetHandle: 'main-in' },
      ],
    })

    await login(page)
    await page.goto(`/workflows/${wf.id}`)
    await expect(page.getByRole('button', { name: /Execute/i })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('workflow-execute').click()
    await page.getByTestId('workflow-execute-run').click()

    await expect(page.locator('pre').filter({ hasText: /success|greeting|Hello E2E/i })).toBeVisible({ timeout: 30_000 })
  })

  test('single node test runs set node only', async ({ page, request }) => {
    const token = await apiLogin(request)
    const wf = await createWorkflow(request, token, {
      name: `E2E Step Test ${Date.now()}`,
      nodes: [
        {
          id: 'n1',
          type: 'set_node',
          position: { x: 0, y: 0 },
          data: {
            type: 'set_node',
            label: 'Assign',
            parameters: { fields: '{"step": "ok"}' },
          },
        },
      ],
      connections: [],
    })

    await login(page)
    await page.goto(`/workflows/${wf.id}`)
    await page.locator('.react-flow__node').first().hover()
    await page.getByTitle('Test this step').click()
    await expect(page.locator('.result-badge')).toBeVisible({ timeout: 30_000 })
  })
})
