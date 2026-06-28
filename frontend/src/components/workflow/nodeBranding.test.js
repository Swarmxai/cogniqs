import { describe, expect, it } from 'vitest'
import { applyNodeBrand, getCategoryBrand, CATEGORY_BRAND, LLM_NODE_BRAND } from './nodeBranding'

describe('nodeBranding', () => {
  it('renames known nodes', () => {
    const branded = applyNodeBrand({ name: 'set_node', displayName: 'Set', icon: 'tag' })
    expect(branded.displayName).toBe('Assign values')
  })

  it('exposes reordered category labels', () => {
    expect(getCategoryBrand('ai').label).toBe('Intelligent agents')
    expect(CATEGORY_BRAND.ml.label).toBe('Model studio')
  })

  it('assigns distinct provider icons to llm nodes', () => {
    expect(applyNodeBrand({ name: 'llm_openai', icon: 'sparkles' }).icon).toBe('openai')
    expect(applyNodeBrand({ name: 'llm_groq', icon: 'zap' }).icon).toBe('groq')
    expect(applyNodeBrand({ name: 'llm_gemini', icon: 'gem' }).icon).toBe('google')
    expect(Object.keys(LLM_NODE_BRAND)).toHaveLength(8)
  })
})
