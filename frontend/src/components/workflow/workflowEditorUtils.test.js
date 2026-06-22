import { describe, expect, it } from 'vitest'
import {
  buildFlowNodeFromApi,
  edgeStyleFor,
  getAiType,
  normStatus,
  paintExecutionResults,
  serializeWorkflow,
  AI_EDGE,
  MAIN_EDGE,
} from './workflowEditorUtils'

describe('workflowEditorUtils', () => {
  it('detects AI handle types', () => {
    expect(getAiType('ai_tool-out')).toBe('ai_tool')
    expect(getAiType('main-out')).toBeNull()
  })

  it('picks edge style by handle', () => {
    expect(edgeStyleFor('ai_tool-out')).toEqual(AI_EDGE)
    expect(edgeStyleFor('main-out')).toEqual(MAIN_EDGE)
  })

  it('normalizes failed status to error', () => {
    expect(normStatus('failed')).toBe('error')
    expect(normStatus('success')).toBe('success')
  })

  it('builds workflow node from API payload', () => {
    const node = buildFlowNodeFromApi(
      {
        id: 'n1',
        type: 'set_node',
        customName: 'My Set',
        disabled: true,
        data: { parameters: { fields: '{}' } },
      },
      { set_node: { displayName: 'Set', properties: [] } },
      0,
      () => 'new_id',
    )
    expect(node.type).toBe('workflowNode')
    expect(node.data.disabled).toBe(true)
    expect(node.data.label).toBe('My Set')
  })

  it('builds sticky note from API payload', () => {
    const node = buildFlowNodeFromApi(
      { id: 's1', type: 'sticky_note', text: 'hello', color: '#fff' },
      {},
      0,
      () => 'new_id',
    )
    expect(node.type).toBe('stickyNote')
    expect(node.data.text).toBe('hello')
  })

  it('serializes workflow nodes including disabled and sticky notes', () => {
    const { nodes, connections } = serializeWorkflow(
      [
        {
          id: 'n1',
          type: 'workflowNode',
          position: { x: 1, y: 2 },
          data: { type: 'set_node', label: 'Set', disabled: true, parameters: { x: 1 } },
        },
        {
          id: 's1',
          type: 'stickyNote',
          position: { x: 3, y: 4 },
          data: { text: 'note', color: '#fef3c7' },
        },
      ],
      [{ source: 'n1', target: 'n2', sourceHandle: 'main-out', targetHandle: 'main-in' }],
    )
    expect(nodes[0].disabled).toBe(true)
    expect(nodes[1]).toEqual({
      id: 's1',
      type: 'sticky_note',
      position: { x: 3, y: 4 },
      text: 'note',
      color: '#fef3c7',
    })
    expect(connections).toHaveLength(1)
  })

  it('paints execution results with step numbers', () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ]
    const painted = paintExecutionResults(nodes, {
      a: { status: 'success' },
      b: { status: 'success' },
    }, 'success')
    expect(painted[0].data._stepNumber).toBe(1)
    expect(painted[1].data._stepNumber).toBe(2)
  })

  it('marks unexecuted nodes skipped on error', () => {
    const nodes = [{ id: 'a', data: {} }, { id: 'b', data: {} }]
    const painted = paintExecutionResults(nodes, { a: { status: 'error' } }, 'error')
    expect(painted[1].data._nodeResult.status).toBe('skipped')
  })
})
