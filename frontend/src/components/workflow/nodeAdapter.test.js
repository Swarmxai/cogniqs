import { describe, expect, it } from 'vitest'
import { adaptNode, deriveGroup } from './nodeAdapter'

describe('deriveGroup', () => {
  it('maps trigger category', () => {
    expect(deriveGroup({ category: 'Triggers' })).toBe('trigger')
  })

  it('maps aiOutputType over category', () => {
    expect(deriveGroup({ category: 'Integrations', aiOutputType: 'ai_tool' })).toBe('ai_tool')
  })

  it('maps newly added backend categories', () => {
    expect(deriveGroup({ category: 'Human Gate' })).toBe('human_review')
    expect(deriveGroup({ category: 'Control Flow' })).toBe('logic')
    expect(deriveGroup({ category: 'Data Shaping' })).toBe('transform')
    expect(deriveGroup({ category: 'App Connectors' })).toBe('action')
    expect(deriveGroup({ category: 'AI' })).toBe('action')
    expect(deriveGroup({ category: 'NLP' })).toBe('action')
    expect(deriveGroup({ category: 'Vector Stores' })).toBe('ai_vectorStore')
    expect(deriveGroup({ category: 'Retrievers' })).toBe('ai_retriever')
    expect(deriveGroup({ category: 'Output Parsers' })).toBe('ai_outputParser')
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
