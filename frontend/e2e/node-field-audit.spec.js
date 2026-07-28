/**
 * Field-by-field node validation E2E:
 * - API lists all nodes
 * - Build a workflow with offline-safe nodes and execute
 * - UI node picker shows branded entries for key categories
 */
import { test, expect } from '@playwright/test'
import { login, apiLogin, createWorkflow } from './helpers.js'

const OFFLINE_CHAIN = [
  {
    id: 't1',
    type: 'manual_trigger',
    position: { x: 80, y: 180 },
    data: { type: 'manual_trigger', label: 'Start', parameters: {} },
  },
  {
    id: 's1',
    type: 'set_node',
    position: { x: 320, y: 180 },
    data: { type: 'set_node', label: 'Assign', parameters: { fields: '{"city":"Chennai","temp":32}' } },
  },
  {
    id: 'f1',
    type: 'filter_node',
    position: { x: 560, y: 180 },
    data: { type: 'filter_node', label: 'Filter', parameters: { field: 'temp', operator: 'gt', value: '20' } },
  },
  {
    id: 'c1',
    type: 'code_node',
    position: { x: 800, y: 180 },
    data: {
      type: 'code_node',
      label: 'Script',
      parameters: { code: "result = {'city': items[0].get('city') if items else 'n/a', 'ok': True}" },
    },
  },
]

const OFFLINE_EDGES = [
  { source: 't1', target: 's1', sourceHandle: 'main-out', targetHandle: 'main-in' },
  { source: 's1', target: 'f1', sourceHandle: 'main-out', targetHandle: 'main-in' },
  { source: 'f1', target: 'c1', sourceHandle: 'main-out', targetHandle: 'main-in' },
]

test.describe('Node field validation', () => {
  test('API registers 80+ node types with icons and categories', async ({ request }) => {
    const token = await apiLogin(request)
    const resp = await request.get('/api/nodes', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    const nodes = body.nodes || body
    expect(nodes.length).toBeGreaterThanOrEqual(80)

    const names = new Set(nodes.map((n) => n.name))
    for (const required of [
      'manual_trigger', 'set_node', 'if_node', 'code_node', 'http_request',
      'ai_agent', 'llm_openai', 'llm_azure', 'vision_ocr', 'human_approval',
      'loop_node', 'document_ingest', 'eda_report',
    ]) {
      expect(names.has(required), `missing node ${required}`).toBeTruthy()
    }

    for (const n of nodes) {
      expect(n.displayName, n.name).toBeTruthy()
      expect(n.category, n.name).toBeTruthy()
      expect(n.icon, n.name).toBeTruthy()
    }
  })

  test('offline node chain executes successfully end-to-end', async ({ request }) => {
    const token = await apiLogin(request)
    const wf = await createWorkflow(request, token, {
      name: `Node Field Audit ${Date.now()}`,
      nodes: OFFLINE_CHAIN,
      connections: OFFLINE_EDGES,
    })

    const exec = await request.post(`/api/workflows/${wf.id}/execute`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { trigger_data: {} },
    })
    expect(exec.ok()).toBeTruthy()
    const result = await exec.json()
    expect(result.status).toBe('success')
    expect(result.error).toBeFalsy()
  })

  test('node picker surfaces OCR, human gate, and data shaping brands', async ({ page, request }) => {
    const token = await apiLogin(request)
    const wf = await createWorkflow(request, token, {
      name: `UI Node Audit ${Date.now()}`,
      nodes: [{
        id: 't1',
        type: 'manual_trigger',
        position: { x: 0, y: 0 },
        data: { type: 'manual_trigger', label: 'Start', parameters: {} },
      }],
      connections: [],
    })

    await login(page)
    await page.goto(`/workflows/${wf.id}`)
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 20_000 })

    await page.locator('.react-flow__node').first().hover()
    await page.getByTitle('Add next step').click()

    const search = page.getByPlaceholder('Search blocks...')
    await expect(search).toBeVisible({ timeout: 15_000 })

    await search.fill('Vision OCR')
    await expect(page.getByText(/Azure Vision OCR/i).first()).toBeVisible({ timeout: 10_000 })

    await search.fill('Human approval')
    await expect(page.getByText(/Human approval/i).first()).toBeVisible()

    await search.fill('Assign values')
    await expect(page.getByText(/Assign values/i).first()).toBeVisible()

    // Click Assign values onto the canvas
    await page.getByText(/Assign values/i).first().click()
    await expect(page.getByText(/Assign values/i).first()).toBeVisible()
  })
})
