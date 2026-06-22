/**
 * Adapts Cogniqs backend node descriptions (category / aiOutputType / isAiSubnode)
 * into the mindscrybe-style `desc` shape the ported WorkflowNode + NodeSelectorPanel
 * expect — primarily by deriving a `group` field.
 */

const CATEGORY_TO_GROUP = {
  Triggers: 'trigger',
  'Chat Models': 'ai_model',
  Tools: 'ai_tool',
  Memory: 'ai_memory',
  Embeddings: 'ai_embedding',
  'AI Agents': 'action',
  'AI Chains': 'action',
  RAG: 'action',
  Integrations: 'action',
  Data: 'transform',
  Logic: 'logic',
  'ML Analysis': 'analysis',
  'ML Training': 'ml',
  'ML Data': 'ml',
}

const AI_OUTPUT_TO_GROUP = {
  ai_languageModel: 'ai_model',
  ai_tool: 'ai_tool',
  ai_memory: 'ai_memory',
  ai_embeddings: 'ai_embedding',
  ai_embedding: 'ai_embedding',
  ai_vectorStore: 'ai_vectorStore',
  ai_retriever: 'ai_retriever',
  ai_outputParser: 'ai_outputParser',
}

export function deriveGroup(meta) {
  if (!meta) return 'action'
  if (meta.aiOutputType && AI_OUTPUT_TO_GROUP[meta.aiOutputType]) {
    return AI_OUTPUT_TO_GROUP[meta.aiOutputType]
  }
  if (meta.category && CATEGORY_TO_GROUP[meta.category]) {
    return CATEGORY_TO_GROUP[meta.category]
  }
  return 'action'
}

/** Return a new desc with `group` populated; safe to pass to WorkflowNode / selector. */
export function adaptNode(meta) {
  if (!meta) return meta
  return { ...meta, group: meta.group || deriveGroup(meta) }
}

/** Map a /api/nodes response into a flat, adapted list of descriptions. */
export function adaptNodeList(nodesResp) {
  const list = Array.isArray(nodesResp) ? nodesResp : nodesResp?.nodes || []
  return list.map(adaptNode)
}
