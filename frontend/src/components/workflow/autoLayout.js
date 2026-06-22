import { getHandleType } from './constants'

const COL_WIDTH = 300
const ROW_HEIGHT = 140
const START_X = 80
const START_Y = 180
const SUBNODE_OFFSET_Y = 230
const SUBNODE_SPACING = 170

function isSubnode(node) {
  return node.data?.nodeMeta?.isAiSubnode === true
}

/**
 * Auto-arrange workflow nodes: main flow left→right, AI subnodes in a row below their parent.
 */
export function autoLayoutNodes(nodes, edges) {
  if (!nodes.length) return nodes

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const mainNodes = nodes.filter((n) => !isSubnode(n))
  const subnodeIds = new Set(nodes.filter(isSubnode).map((n) => n.id))

  const mainEdges = edges.filter(
    (e) => getHandleType(e.sourceHandle) === 'main' && getHandleType(e.targetHandle) === 'main',
  )
  const aiEdges = edges.filter((e) => getHandleType(e.sourceHandle) !== 'main')

  const inDegree = new Map(mainNodes.map((n) => [n.id, 0]))
  const children = new Map(mainNodes.map((n) => [n.id, []]))

  for (const e of mainEdges) {
    const src = byId.get(e.source)
    const tgt = byId.get(e.target)
    if (!src || !tgt || isSubnode(src) || isSubnode(tgt)) continue
    children.get(e.source).push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
  }

  const layers = []
  const visited = new Set()
  let queue = mainNodes.filter((n) => (inDegree.get(n.id) || 0) === 0).map((n) => n.id)

  while (queue.length) {
    layers.push([...queue])
    queue.forEach((id) => visited.add(id))
    const next = []
    for (const id of queue) {
      for (const childId of children.get(id) || []) {
        if (visited.has(childId)) continue
        inDegree.set(childId, inDegree.get(childId) - 1)
        if (inDegree.get(childId) <= 0) {
          next.push(childId)
          visited.add(childId)
        }
      }
    }
    queue = next
  }

  for (const n of mainNodes) {
    if (!visited.has(n.id)) {
      if (!layers.length) layers.push([])
      layers[layers.length - 1].push(n.id)
    }
  }

  const positions = new Map()

  layers.forEach((layer, col) => {
    const blockH = layer.length * ROW_HEIGHT
    const baseY = START_Y - (blockH - ROW_HEIGHT) / 2
    layer.forEach((id, row) => {
      positions.set(id, { x: START_X + col * COL_WIDTH, y: baseY + row * ROW_HEIGHT })
    })
  })

  const subsByTarget = new Map()
  for (const e of aiEdges) {
    const src = byId.get(e.source)
    if (!src || !subnodeIds.has(e.source)) continue
    if (!subsByTarget.has(e.target)) subsByTarget.set(e.target, [])
    if (!subsByTarget.get(e.target).includes(e.source)) {
      subsByTarget.get(e.target).push(e.source)
    }
  }

  for (const id of subnodeIds) {
    let linked = false
    for (const ids of subsByTarget.values()) {
      if (ids.includes(id)) linked = true
    }
    if (!linked) {
      if (!subsByTarget.has('_orphan')) subsByTarget.set('_orphan', [])
      subsByTarget.get('_orphan').push(id)
    }
  }

  for (const [targetId, subIds] of subsByTarget) {
    const parentPos = targetId === '_orphan'
      ? { x: START_X, y: START_Y + SUBNODE_OFFSET_Y }
      : positions.get(targetId) || { x: START_X + COL_WIDTH, y: START_Y }

    const count = subIds.length
    const span = (count - 1) * SUBNODE_SPACING
    const baseX = parentPos.x + 90 - span / 2

    subIds.forEach((id, i) => {
      positions.set(id, {
        x: Math.max(40, baseX + i * SUBNODE_SPACING),
        y: parentPos.y + SUBNODE_OFFSET_Y,
      })
    })
  }

  return nodes.map((n) => ({
    ...n,
    position: positions.get(n.id) || n.position,
  }))
}
