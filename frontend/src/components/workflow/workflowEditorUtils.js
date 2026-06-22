/**
 * Pure helpers for workflow editor serialization and execution painting.
 * Extracted for unit testing and reuse in WorkflowEditor.
 */

export const AI_TYPES = [
  'ai_languageModel', 'ai_agent', 'ai_tool', 'ai_memory', 'ai_outputParser',
  'ai_embedding', 'ai_embeddings', 'ai_vectorStore', 'ai_retriever',
]

export const MAIN_EDGE = { stroke: '#94a3b8', strokeWidth: 2 }
export const AI_EDGE = { stroke: '#10a37f', strokeWidth: 2, strokeDasharray: '6 3' }

export function getAiType(handleId) {
  if (!handleId) return null
  for (const t of AI_TYPES) if (handleId.startsWith(t)) return t
  return null
}

export function edgeStyleFor(handleId) {
  return getAiType(handleId) ? AI_EDGE : MAIN_EDGE
}

export function normStatus(s) {
  const v = String(s || '').toLowerCase()
  return v === 'failed' ? 'error' : v
}

/** Map API workflow node → React Flow node. */
export function buildFlowNodeFromApi(n, nodeMap, index, newId) {
  if (n.type === 'sticky_note') {
    const nid = n.id || newId()
    return {
      id: nid,
      type: 'stickyNote',
      position: n.position || { x: 140 + index * 280, y: 180 },
      data: {
        text: n.text || '',
        color: n.color || '#fef3c7',
      },
    }
  }

  const meta = nodeMap[n.type] || { displayName: n.type, properties: [] }
  const nid = n.id || newId()
  const disabled = n.disabled ?? n.data?.disabled ?? false
  return {
    id: nid,
    type: 'workflowNode',
    position: n.position || { x: 140 + index * 280, y: 180 },
    data: {
      type: n.type,
      label: n.customName || meta.displayName || n.type,
      customName: n.customName || meta.displayName || n.type,
      parameters: n.data?.parameters || n.parameters ||
        Object.fromEntries((meta.properties || []).map((p) => [p.name, p.default])),
      disabled,
      _desc: meta,
      _nodeId: nid,
    },
  }
}

/** Map React Flow nodes + edges → Cogniqs API payload. */
export function serializeWorkflow(nodes, edges) {
  const backendNodes = nodes.map((n) => {
    if (n.type === 'stickyNote') {
      return {
        id: n.id,
        type: 'sticky_note',
        position: n.position,
        text: n.data.text || '',
        color: n.data.color || '#fef3c7',
      }
    }
    return {
      id: n.id,
      type: n.data.type,
      position: n.position,
      customName: n.data.customName || n.data.label,
      disabled: !!n.data.disabled,
      data: { type: n.data.type, parameters: n.data.parameters || {} },
    }
  })

  const connections = edges.map((e) => ({
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || 'main-out',
    targetHandle: e.targetHandle || 'main-in',
  }))

  return { nodes: backendNodes, connections }
}

/** Paint execution results onto a nodes array (immutable). */
export function paintExecutionResults(nodes, nodeOutputs, execStatus) {
  let step = 0
  const failed = normStatus(execStatus) === 'error'
  return nodes.map((nd) => {
    const nr = nodeOutputs?.[nd.id]
    if (nr) {
      step += 1
      return { ...nd, data: { ...nd.data, _stepNumber: step, _nodeResult: nr } }
    }
    if (failed) {
      return {
        ...nd,
        data: {
          ...nd.data,
          _stepNumber: undefined,
          _nodeResult: { status: 'skipped' },
        },
      }
    }
    return { ...nd, data: { ...nd.data, _stepNumber: undefined, _nodeResult: undefined } }
  })
}
