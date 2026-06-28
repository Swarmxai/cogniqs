/** Shared Playwright helpers for Cogniqs E2E tests */

export const DEMO_EMAIL = 'demo@cogniqs.dev'
export const DEMO_PASSWORD = 'demo1234'

export async function login(page) {
  await page.goto('/login')
  await page.getByTestId('login-email').fill(DEMO_EMAIL)
  await page.getByTestId('login-password').fill(DEMO_PASSWORD)
  await page.getByTestId('login-submit').click()
  await page.waitForURL('/', { timeout: 30_000 })
}

export async function apiLogin(request) {
  const resp = await request.post('/api/auth/login', {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  })
  const data = await resp.json()
  if (data.mfa_required) {
    throw new Error('Demo user has MFA enabled — disable for E2E or use login/mfa')
  }
  return data.access_token
}

export async function createWorkflow(request, token, payload = {}) {
  const resp = await request.post('/api/workflows', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: payload.name || `E2E Workflow ${Date.now()}`,
      nodes: payload.nodes || [],
      connections: payload.connections || [],
      ...payload,
    },
  })
  if (!resp.ok()) {
    throw new Error(`createWorkflow failed: ${await resp.text()}`)
  }
  return resp.json()
}
