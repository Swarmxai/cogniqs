import { test, expect } from '@playwright/test'
import { login } from './helpers.js'

test.describe('Knowledge Studio', () => {
  const collectionName = `e2e-ks-${Date.now()}`

  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/vectors')
    await expect(page.getByRole('heading', { name: 'Knowledge Studio' })).toBeVisible()
  })

  test('create collection, ingest text, and semantic search', async ({ page }) => {
    const uniqueDoc = `Cogniqs planetary probe launched in ${Date.now()} with quantum sensors.`

    page.on('dialog', (d) => d.accept())

    await page.getByTestId('ks-collection-name').fill(collectionName)
    await page.getByTestId('ks-create-collection').click()
    await expect(page.getByTestId(`ks-collection-${collectionName}`)).toBeVisible({ timeout: 15_000 })

    await page.getByTestId(`ks-collection-${collectionName}`).click()
    await page.getByTestId('ks-ingest-text').fill(uniqueDoc)
    await page.getByTestId('ks-ingest-btn').click()
    await page.getByTestId('ks-search-input').fill('quantum sensors probe')
    await page.getByTestId('ks-search-btn').click()

    await expect(page.getByText('Match 1')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/planetary probe|quantum sensors/i)).toBeVisible()
  })
})
