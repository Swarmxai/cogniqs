import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.E2E_PORT || '5176'
const BASE = `http://localhost:${PORT}`
const BACKEND_DIR = path.resolve(__dirname, '../backend')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: '.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000',
      cwd: BACKEND_DIR,
      url: 'http://127.0.0.1:8000/health',
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: `npm run dev -- --host localhost --port ${PORT} --strictPort`,
      cwd: __dirname,
      url: BASE,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
})
