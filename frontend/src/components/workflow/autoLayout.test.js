import { describe, expect, it } from 'vitest'
import { autoLayoutNodes } from './autoLayout'

describe('autoLayoutNodes', () => {
  it('returns empty array unchanged', () => {
    expect(autoLayoutNodes([], [])).toEqual([])
  })

  it('lays main flow left to right', () => {
    const nodes = [
      { id: 'a', data: {}, position: { x: 0, y: 0 } },
      { id: 'b', data: {}, position: { x: 0, y: 0 } },
    ]
    const edges = [
      { source: 'a', target: 'b', sourceHandle: 'main-out', targetHandle: 'main-in' },
    ]
    const laid = autoLayoutNodes(nodes, edges)
    const a = laid.find((n) => n.id === 'a')
    const b = laid.find((n) => n.id === 'b')
    expect(b.position.x).toBeGreaterThan(a.position.x)
  })

  it('places AI subnodes below parent', () => {
    const nodes = [
      { id: 'parent', data: {}, position: { x: 0, y: 0 } },
      { id: 'sub', data: { nodeMeta: { isAiSubnode: true } }, position: { x: 0, y: 0 } },
    ]
    const edges = [
      { source: 'sub', target: 'parent', sourceHandle: 'ai_tool-out', targetHandle: 'ai_tool-in' },
    ]
    const laid = autoLayoutNodes(nodes, edges)
    const parent = laid.find((n) => n.id === 'parent')
    const sub = laid.find((n) => n.id === 'sub')
    expect(sub.position.y).toBeGreaterThan(parent.position.y)
  })
})
