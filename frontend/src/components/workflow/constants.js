export const AI_EDGE_STYLES = {
  ai_languageModel: { stroke: '#8b5cf6', strokeDasharray: '6 4' },
  ai_tool: { stroke: '#f59e0b', strokeDasharray: '6 4' },
  ai_memory: { stroke: '#ec4899', strokeDasharray: '6 4' },
  ai_embeddings: { stroke: '#059669', strokeDasharray: '6 4' },
}

export const HANDLE_COLORS = {
  main: '#6366f1',
  ai_languageModel: '#8b5cf6',
  ai_tool: '#f59e0b',
  ai_memory: '#ec4899',
  ai_embeddings: '#059669',
}

export function getHandleType(handleId) {
  if (!handleId) return 'main'
  if (handleId.includes('ai_languageModel')) return 'ai_languageModel'
  if (handleId.includes('ai_tool')) return 'ai_tool'
  if (handleId.includes('ai_memory')) return 'ai_memory'
  if (handleId.includes('ai_embeddings')) return 'ai_embeddings'
  return 'main'
}

export function nodeToFlowNode(nodeDef, index = 0) {
  return {
    id: nodeDef.id,
    type: 'cogniqs',
    position: nodeDef.position || { x: 100 + index * 50, y: 100 + index * 30 },
    data: {
      type: nodeDef.type,
      label: nodeDef.customName || nodeDef.type,
      parameters: nodeDef.data?.parameters || nodeDef.parameters || {},
      nodeMeta: nodeDef.nodeMeta || {},
      executionStatus: null,
    },
  }
}

export function flowToBackend(nodes, edges) {
  const backendNodes = nodes.map((n) => ({
    id: n.id,
    type: n.data.type,
    position: n.position,
    customName: n.data.label,
    data: { type: n.data.type, parameters: n.data.parameters || {} },
  }))
  const connections = edges.map((e) => ({
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || 'main-out',
    targetHandle: e.targetHandle || 'main-in',
  }))
  return { nodes: backendNodes, connections }
}
