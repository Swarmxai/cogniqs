/**
 * WorkflowEditor — visual workflow editor cloned from mindscrybe's layout and
 * interaction model, re-themed to Cogniqs and wired to the Cogniqs backend API.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, Save, Play, Plus, MessageSquare, AlignLeft, History, Trash2, Webhook, Power } from 'lucide-react'
import { api } from '../api/client'
import { WorkflowNode } from '../components/workflow/WorkflowNode'
import { StickyNoteNode } from '../components/workflow/StickyNoteNode'
import { NodeSelectorPanel } from '../components/workflow/NodeSelectorPanel'
import { AddFirstStepPlaceholder } from '../components/workflow/AddFirstStepPlaceholder'
import NDVPanel from '../components/workflow/NDVPanel'
import { ExecutionHistory } from '../components/workflow/ExecutionHistory'
import ExecutePanel from '../components/workflow/ExecutePanel'
import ChatPanel from '../components/workflow/ChatPanel'
import { adaptNode } from '../components/workflow/nodeAdapter'
import { applyNodeBrand } from '../components/workflow/nodeBranding'
import { autoLayoutNodes } from '../components/workflow/autoLayout'
import {
  AI_EDGE,
  MAIN_EDGE,
  buildFlowNodeFromApi,
  edgeStyleFor,
  getAiType,
  normStatus,
  paintExecutionResults,
  serializeWorkflow,
} from '../components/workflow/workflowEditorUtils'
import '../components/workflow/mindscrybe-editor.css'
import '../components/workflow/cogniqs-nodes.css'
import '../components/workflow/cogniqs-sidepanel.css'

const nodeTypes = { workflowNode: WorkflowNode, stickyNote: StickyNoteNode }

let nodeIdCounter = 1
const newId = () => `node_${Date.now()}_${nodeIdCounter++}`

export default function WorkflowEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState(null)
  const [workflowName, setWorkflowName] = useState('')
  const [projectId, setProjectId] = useState(null)
  const [workflowActive, setWorkflowActive] = useState(false)
  const [projects, setProjects] = useState([])
  const [webhookInfo, setWebhookInfo] = useState(null)
  const [showWebhook, setShowWebhook] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [nodeMap, setNodeMap] = useState({})
  const [descriptions, setDescriptions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [picker, setPicker] = useState(null)
  const [showExecute, setShowExecute] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved'
  const [execResult, setExecResult] = useState(null)
  const [execRefreshKey, setExecRefreshKey] = useState(0)
  const rfInstance = useRef(null)

  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  const buildFlowNode = useCallback((n, map, i) => {
    const meta = map[n.type] || adaptNode({ name: n.type, displayName: n.type })
    const enrichedMap = { ...map, [n.type]: meta }
    return buildFlowNodeFromApi(n, enrichedMap, i, newId)
  }, [])

  const onStickyTextChange = useCallback((nodeId, text) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, text } } : n)))
  }, [setNodes])

  useEffect(() => {
    Promise.all([api.getWorkflow(id), api.getNodes(), api.getProjects()]).then(([wf, resp, projs]) => {
      setWorkflow(wf)
      setWorkflowName(wf.name || '')
      setProjectId(wf.project_id ?? null)
      setWorkflowActive(!!wf.active)
      setProjects(projs)
      const map = {}
      const descs = []
      ;(resp.nodes || []).forEach((n) => {
        const a = adaptNode(applyNodeBrand(n))
        map[n.name] = a
        descs.push(a)
      })
      setNodeMap(map)
      setDescriptions(descs)

      const fNodes = (wf.nodes || []).map((n, i) => {
        const flowNode = buildFlowNode(n, map, i)
        if (flowNode.type === 'stickyNote') {
          flowNode.data.onTextChange = (text) => onStickyTextChange(flowNode.id, text)
        }
        return flowNode
      })
      const fEdges = (wf.connections || []).map((c, i) => ({
        id: `e-${i}`,
        source: c.source,
        target: c.target,
        sourceHandle: c.sourceHandle,
        targetHandle: c.targetHandle,
        style: edgeStyleFor(c.sourceHandle),
        animated: !!getAiType(c.sourceHandle),
        markerEnd: { type: MarkerType.ArrowClosed },
      }))
      setNodes(fNodes)
      setEdges(fEdges)
      setTimeout(() => rfInstance.current?.fitView({ padding: 0.3, duration: 300 }), 80)
    }).catch(console.error)
  }, [id, setNodes, setEdges, buildFlowNode, onStickyTextChange])

  const placeNode = useCallback((after, handleType) => {
    const all = nodesRef.current
    if (after && handleType) {
      const siblings = edgesRef.current.filter(
        (e) => e.target === after.id && getAiType(e.targetHandle) === handleType
      ).length
      return { x: after.position.x + siblings * 160 - 20, y: after.position.y + 190 }
    }
    if (after) return { x: after.position.x + 300, y: after.position.y }
    if (!all.length) return { x: 160, y: 200 }
    const rightMost = all.reduce((a, b) => (b.position.x > a.position.x ? b : a), all[0])
    return { x: rightMost.position.x + 300, y: rightMost.position.y }
  }, [])

  const addStickyNote = useCallback(() => {
    const nid = newId()
    const pos = placeNode(null, null)
    setNodes((nds) => [...nds, {
      id: nid,
      type: 'stickyNote',
      position: { x: pos.x, y: pos.y + 120 },
      data: {
        text: '',
        color: '#fef3c7',
        onTextChange: (text) => onStickyTextChange(nid, text),
      },
    }])
  }, [placeNode, setNodes, onStickyTextChange])

  const addNode = useCallback((desc, ctx = {}) => {
    const meta = adaptNode(desc)
    const after = ctx.afterNodeId ? nodesRef.current.find((n) => n.id === ctx.afterNodeId) : null
    const handleType = ctx.handleType || null
    const nid = newId()
    const newNode = {
      id: nid,
      type: 'workflowNode',
      position: placeNode(after, handleType),
      data: {
        type: meta.name,
        label: meta.displayName,
        customName: meta.displayName,
        parameters: Object.fromEntries((meta.properties || []).map((p) => [p.name, p.default])),
        _desc: meta,
        _nodeId: nid,
      },
    }
    setNodes((nds) => [...nds, newNode])

    if (after) {
      if (handleType) {
        const srcType = meta.aiOutputType || handleType
        setEdges((eds) => addEdge({
          id: `e-${nid}`,
          source: nid,
          target: after.id,
          sourceHandle: `${srcType}-out`,
          targetHandle: `${handleType}-in`,
          style: AI_EDGE,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        }, eds))
      } else if ((meta.inputs || ['main']).includes('main')) {
        setEdges((eds) => addEdge({
          id: `e-${nid}`,
          source: after.id,
          target: nid,
          sourceHandle: 'main-out',
          targetHandle: 'main-in',
          style: MAIN_EDGE,
          markerEnd: { type: MarkerType.ArrowClosed },
        }, eds))
      }
    }
    setSelectedId(nid)
    setPicker(null)
  }, [placeNode, setNodes, setEdges])

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      style: edgeStyleFor(params.sourceHandle),
      animated: !!getAiType(params.sourceHandle),
      markerEnd: { type: MarkerType.ArrowClosed },
    }, eds))
  }, [setEdges])

  const onAddAfter = useCallback((nodeId) => setPicker({ afterNodeId: nodeId, mode: 'all' }), [])
  const onAddAiSubNode = useCallback((nodeId, inputType) => setPicker({ afterNodeId: nodeId, handleType: inputType, mode: inputType }), [])
  const onDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedId((cur) => (cur === nodeId ? null : cur))
  }, [setNodes, setEdges])
  const onToggleNode = useCallback((nodeId) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, disabled: !n.data.disabled } } : n)))
  }, [setNodes])
  const onExecuteWorkflow = useCallback(() => setShowExecute(true), [])
  const onOpenChat = useCallback(() => setShowChat(true), [])
  const noop = useCallback(() => {}, [])

  const save = useCallback(async () => {
    setSaveStatus('saving')
    try {
      const payload = serializeWorkflow(nodesRef.current, edgesRef.current)
      await api.updateWorkflow(id, {
        ...payload,
        name: workflowName,
        project_id: projectId,
        active: workflowActive,
      })
      setWorkflow((w) => (w ? { ...w, name: workflowName, project_id: projectId, active: workflowActive } : w))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 1500)
    } catch (err) {
      setSaveStatus(null)
      alert(err.message)
    }
  }, [id, workflowName, projectId, workflowActive])

  const applyExecution = useCallback((ex) => {
    const outputs = ex?.result?.nodeOutputs || ex?.nodeOutputs || {}
    const status = ex?.status || ex?.result?.status
    setNodes((nds) => paintExecutionResults(nds, outputs, status))
    setExecResult({
      status: normStatus(status),
      duration_ms: ex?.finished_at && ex?.started_at
        ? new Date(ex.finished_at) - new Date(ex.started_at)
        : null,
    })
  }, [setNodes])

  const execute = useCallback(async (triggerData) => {
    await save()
    const ex = await api.executeWorkflow(id, triggerData)
    applyExecution(ex)
    setExecRefreshKey((k) => k + 1)
    return ex
  }, [id, save, applyExecution])

  const runSingleNode = useCallback(async (nodeId) => {
    await save()
    try {
      const ex = await api.executeWorkflowNode(id, nodeId, { message: 'step test', approved: true })
      applyExecution(ex)
      setExecRefreshKey((k) => k + 1)
    } catch (err) {
      alert(err.message)
    }
  }, [id, save, applyExecution])

  const callbacks = useMemo(() => ({
    onAddAfter,
    onAddAiSubNode,
    onDeleteNode,
    onToggleNode,
    onRunNode: runSingleNode,
    onExecuteWorkflow,
    onOpenChat,
    onOpenMoreMenu: noop,
  }), [onAddAfter, onAddAiSubNode, onDeleteNode, onToggleNode, runSingleNode, onExecuteWorkflow, onOpenChat, noop])

  const nodesForFlow = useMemo(() => nodes.map((n) => {
    if (n.type === 'stickyNote') {
      return {
        ...n,
        selected: n.id === selectedId,
        data: {
          ...n.data,
          onTextChange: n.data.onTextChange || ((text) => onStickyTextChange(n.id, text)),
        },
      }
    }
    const connectedAi = edges
      .filter((e) => e.target === n.id)
      .map((e) => getAiType(e.targetHandle))
      .filter(Boolean)
    return {
      ...n,
      selected: n.id === selectedId,
      data: { ...n.data, _nodeId: n.id, _connectedAiInputs: connectedAi, ...callbacks },
    }
  }), [nodes, edges, selectedId, callbacks, onStickyTextChange])

  const hasWebhookTrigger = useMemo(
    () => nodes.some((n) => n.data?.type === 'webhook_trigger'),
    [nodes],
  )

  useEffect(() => {
    if (hasWebhookTrigger) {
      api.getWebhookUrl(id).then(setWebhookInfo).catch(() => setWebhookInfo(null))
    } else {
      setWebhookInfo(null)
    }
  }, [id, hasWebhookTrigger, workflowActive])

  const toggleActive = useCallback(async () => {
    const next = !workflowActive
    try {
      await api.updateWorkflow(id, { active: next })
      setWorkflowActive(next)
      setWorkflow((w) => (w ? { ...w, active: next } : w))
      if (hasWebhookTrigger) api.getWebhookUrl(id).then(setWebhookInfo).catch(() => {})
    } catch (err) {
      alert(err.message)
    }
  }, [id, workflowActive, hasWebhookTrigger])

  const organize = useCallback(() => {
    const laid = autoLayoutNodes(nodesRef.current, edgesRef.current)
    setNodes(laid)
    setTimeout(() => rfInstance.current?.fitView({ padding: 0.3, duration: 300 }), 60)
  }, [setNodes])

  const updateNode = useCallback((updated) => {
    setNodes((nds) => nds.map((n) => (
      n.id === updated.id
        ? { ...updated, data: { ...updated.data, customName: updated.data.label ?? updated.data.customName } }
        : n
    )))
  }, [setNodes])

  const selectedBase = nodes.find((n) => n.id === selectedId) || null
  const selectedMeta = selectedBase ? nodeMap[selectedBase.data.type] : null
  const selectedNodeResult = selectedBase?.data?._nodeResult

  if (!workflow) {
    return (
      <div className="cq-flow workflow-editor-page flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="cq-flow workflow-editor-page">
      {/* ── Top toolbar (mindscrybe) ─────────────────────────────────────── */}
      <div className="editor-topbar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/workflows')}>
          <ArrowLeft size={16} />
        </button>
        <div className="separator" />

        <div className="workflow-name-container">
          <input
            type="text"
            className="workflow-name-input"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Untitled Workflow"
          />
          <select
            className="workflow-name-input ml-2 !w-36 !text-xs opacity-80"
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
            title="Assign to project"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {saveStatus === 'saving' && <span className="save-status">Saving…</span>}
          {saveStatus === 'saved' && <span className="save-status save-status--success">Saved</span>}
        </div>

        <div className="editor-tabs">
          <button type="button" className="editor-tab editor-tab--active">Editor</button>
        </div>

        <div className="editor-topbar-actions">
          {execResult && (
            <span className={`result-badge result-badge--${execResult.status}`}>
              {execResult.status === 'success' ? '✓' : '✕'} {execResult.status}
              {execResult.duration_ms != null && ` · ${execResult.duration_ms.toFixed(0)}ms`}
            </span>
          )}
          {selectedId && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteNode(selectedId)}>
              <Trash2 size={14} />
            </button>
          )}
          <button
            type="button"
            className={`btn btn-ghost btn-sm ${workflowActive ? 'btn-ghost--active' : ''}`}
            onClick={toggleActive}
            title={workflowActive ? 'Workflow is live' : 'Activate for webhooks & schedules'}
          >
            <Power size={14} /> {workflowActive ? 'Live' : 'Inactive'}
          </button>
          {hasWebhookTrigger && webhookInfo && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowWebhook(true)} title="Webhook URL">
              <Webhook size={14} /> Webhook
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addStickyNote} title="Add sticky note">
            Note
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicker({ mode: 'all' })}>
            <Plus size={14} /> Add
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={organize} title="Auto-align nodes">
            <AlignLeft size={14} /> Align
          </button>
          <button
            type="button"
            className={`btn btn-ghost btn-sm ${historyOpen ? 'btn-ghost--active' : ''}`}
            onClick={() => setHistoryOpen((v) => !v)}
          >
            <History size={14} /> History
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={save}>
            <Save size={14} /> Save
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowChat(true)}>
            <MessageSquare size={14} /> Chat
          </button>
          <button type="button" className="btn btn-primary btn-sm" data-testid="workflow-execute" onClick={() => setShowExecute(true)}>
            <Play size={14} /> Execute
          </button>
        </div>
      </div>

      {/* ── Editor body ─────────────────────────────────────────────────── */}
      <div className="editor-body">
        <div className="editor-canvas">
          <ReactFlow
            nodes={nodesForFlow}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => { setSelectedId(null); setPicker(null) }}
            onInit={(inst) => { rfInstance.current = inst }}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--border)" />
            <Controls />
            <MiniMap nodeColor={(n) => n.data?._desc?.color || '#6366f1'} maskColor="rgba(0,0,0,0.05)" />
          </ReactFlow>

          {nodes.length === 0 && !picker && (
            <AddFirstStepPlaceholder onAdd={() => setPicker({ mode: 'trigger' })} />
          )}

          {picker && (
            <NodeSelectorPanel
              open
              mode={picker.mode || 'all'}
              nodeDescriptions={descriptions}
              onSelect={(desc) => addNode(desc, { afterNodeId: picker.afterNodeId, handleType: picker.handleType })}
              onClose={() => setPicker(null)}
            />
          )}

          {showExecute && (
            <ExecutePanel
              onExecute={execute}
              onClose={() => setShowExecute(false)}
              showChat
              onChat={(msg) => api.chat(id, msg).then(() => setShowExecute(false)).catch(alert)}
            />
          )}
          {showChat && <ChatPanel workflowId={id} onClose={() => setShowChat(false)} />}
          {showWebhook && webhookInfo && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowWebhook(false)}>
              <div className="cq-card max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Webhook className="w-4 h-4" /> Production webhook</h3>
                <p className="text-sm text-muted mb-4">
                  {workflowActive
                    ? 'POST JSON to this URL from Slack, Zapier, GitHub, or any HTTP client.'
                    : 'Activate the workflow (Live) before external systems can trigger it.'}
                </p>
                <code className="block text-xs p-3 rounded-xl cq-surface-2 break-all mb-3">
                  {window.location.origin}{webhookInfo.url}
                </code>
                <button type="button" className="cq-btn cq-btn-ghost text-sm"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}${webhookInfo.url}`)}>
                  Copy URL
                </button>
              </div>
            </div>
          )}
        </div>

        <ExecutionHistory
          workflowId={id}
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          refreshKey={execRefreshKey}
          onSelectExecution={(ex) => {
            applyExecution(ex)
            setHistoryOpen(false)
          }}
        />
      </div>

      {/* NDV popup (mindscrybe) */}
      {selectedBase && (
        <>
          <div
            className="ndv-popup-backdrop"
            onClick={() => setSelectedId(null)}
            onKeyDown={(e) => e.key === 'Escape' && setSelectedId(null)}
            role="button"
            tabIndex={0}
            aria-label="Close node config"
          />
          <div className="ndv-popup-wrap" onClick={(e) => e.stopPropagation()}>
            <NDVPanel
              node={selectedBase}
              nodeMeta={selectedMeta}
              nodeResult={selectedNodeResult}
              onChange={updateNode}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </>
      )}
    </div>
  )
}
