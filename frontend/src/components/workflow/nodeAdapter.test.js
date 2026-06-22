import { describe, expect, it } from 'vitest'
import { adaptNode, deriveGroup } from './nodeAdapter'

describe('deriveGroup', () => {
  it('maps trigger category', () => {
    expect(deriveGroup({ category: 'Triggers' })).toBe('trigger')
  })

  it('maps aiOutputType over category', () => {
    expect(deriveGroup({ category: 'Integrations', aiOutputType: 'ai_tool' })).toBe('ai_tool')
  })

  it('defaults to action', () => {
    expect(deriveGroup({})).toBe('action')
    expect(deriveGroup(null)).toBe('action')
  })
})

describe('adaptNode', () => {
  it('adds group without mutating input', () => {
    const meta = { name: 'slack', category: 'Integrations' }
    const adapted = adaptNode(meta)
    expect(adapted.group).toBe('action')
    expect(meta.group).toBeUndefined()
  })

  it('preserves existing group', () => {
    expect(adaptNode({ group: 'custom' }).group).toBe('custom')
  })
})
