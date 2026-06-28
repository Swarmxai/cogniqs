/**
 * WorkflowNode — Cogniqs-native card design (not mindscrybe).
 * Vertical accent cards, pill AI slots, compact sub-node chips.
 */

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Plus, Play, Power, Trash2, MoreHorizontal, MessageSquare } from 'lucide-react'
import { NodeIcon } from './icons/NodeIcons'
import { getGroupBrand, AI_SLOT_BRAND } from './nodeBranding'

const AI_TYPES = [
  'ai_languageModel', 'ai_agent', 'ai_tool', 'ai_memory', 'ai_outputParser',
  'ai_embedding', 'ai_embeddings', 'ai_vectorStore', 'ai_retriever',
]

const AI_LABELS = Object.fromEntries(
  Object.entries(AI_SLOT_BRAND).map(([k, v]) => [k, v.label]),
)

const AI_COLORS = Object.fromEntries(
  Object.entries(AI_SLOT_BRAND).map(([k, v]) => [k, v.color]),
)

function WorkflowNodeInner({ data, selected, id: nodeId }) {
  const safe = data || {}
  const desc = safe._desc || {}
  const group = desc.group || 'action'
  const meta = getGroupBrand(group)
  const isTrigger = group === 'trigger'
  const isChat = desc.name === 'chat_trigger' || desc.name === 'chat_node'
  const icon = desc.icon || 'zap'
  const color = desc.color || meta.color

  const nodeResult = safe._nodeResult
  const stepNumber = safe._stepNumber
  const rawStatus = (nodeResult?.output?.status || nodeResult?.status || '').toLowerCase()
  const status = rawStatus === 'failed' ? 'error' : rawStatus || undefined

  const inputs = desc.inputs || ['main']
  const aiInputs = inputs.filter((i) => AI_TYPES.includes(i))
  const mainInputCount = isTrigger ? 0 : inputs.filter((i) => i === 'main').length
  const outputs = desc.outputs || ['main']
  const hasAiOutput = outputs.some((o) => AI_TYPES.includes(o))
  const hasMainOutput = outputs.includes('main')
  const isSubNode = hasAiOutput && !hasMainOutput

  const connectedAi = safe._connectedAiInputs || []
  const needsModel = aiInputs.includes('ai_languageModel')
  const showWarning = aiInputs.length > 0 && needsModel && !connectedAi.includes('ai_languageModel')

  const params = safe.parameters || {}
  let title = safe.customName || desc.displayName || safe.label || 'Node'
  let subtitle = desc.displayName || desc.name || ''

  if (desc.name === 'http_request' && params.url) {
    title = `${(params.method || 'GET').toUpperCase()} ${params.url.replace(/^https?:\/\//, '').slice(0, 24)}`
  }
  if (desc.name === 'ai_agent') {
    const types = { toolsAgent: 'Tools Agent', conversationalAgent: 'Chat Agent', openAiFunctionsAgent: 'Functions Agent' }
    subtitle = types[params.agent_type] || 'AI Agent'
  }

  const disabled = safe.disabled === true
  const duration = nodeResult?.durationMs ?? nodeResult?.duration_ms

  const slotLabel = (type) => {
    const idx = inputs.indexOf(type)
    const name = (idx >= 0 && desc.inputNames?.[idx]) ? desc.inputNames[idx] : AI_LABELS[type]
    return name
  }

  /* ── AI sub-node (chip) ─────────────────────────────────────────────── */
  if (isSubNode) {
    const outType = outputs.find((o) => AI_TYPES.includes(o)) || 'ai_tool'
    return (
      <div
        className={`cq-node cq-node--sub ${selected ? 'cq-node--selected' : ''} ${disabled ? 'cq-node--disabled' : ''}`}
        style={{ '--node-accent': color }}
      >
        <div className="cq-node-chip">
          <div className="cq-node-actions" style={{ top: -12, right: '50%', transform: 'translateX(50%)' }}>
            <button type="button" className="cq-node-action" onClick={(e) => { e.stopPropagation(); safe.onRunNode?.(nodeId) }} title="Run">
              <Play size={13} />
            </button>
            <button type="button" className={`cq-node-action ${disabled ? 'cq-node-action--off' : ''}`} onClick={(e) => { e.stopPropagation(); safe.onToggleNode?.(nodeId) }} title={disabled ? 'Enable' : 'Disable'}>
              <Power size={13} />
            </button>
            <button type="button" className="cq-node-action cq-node-action--danger" onClick={(e) => { e.stopPropagation(); safe.onDeleteNode?.(nodeId) }} title="Delete">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="cq-node-chip-card">
            <div className="cq-node-chip-icon" style={{ background: color }}>
              <NodeIcon name={icon} size={14} color="#fff" />
            </div>
            <span className="cq-node-chip-label">{title}</span>
            {status === 'success' && <span className="cq-node-chip-status cq-node-chip-status--success">✓</span>}
            {status === 'error' && <span className="cq-node-chip-status cq-node-chip-status--error">✕</span>}
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Top}
          id={`${outType}-out`}
          className="cq-handle cq-handle--ai cq-handle--ai-out"
          style={{ '--handle-color': AI_COLORS[outType] }}
        />
      </div>
    )
  }

  /* ── Standard / trigger card ────────────────────────────────────────── */
  return (
    <div
      className={`cq-node ${isTrigger ? 'cq-node--trigger' : ''} ${selected ? 'cq-node--selected' : ''} ${disabled ? 'cq-node--disabled' : ''} ${aiInputs.length ? 'cq-node--agent' : ''}`}
      style={{ '--node-accent': color }}
    >
      {mainInputCount === 1 && (
        <Handle type="target" position={Position.Left} id="main-in" className="cq-handle cq-handle--main-in" />
      )}
      {mainInputCount > 1 && inputs.filter((i) => i === 'main').map((_, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Left}
          id={`main-in-${i}`}
          className="cq-handle cq-handle--main-in"
          style={{ top: `${30 + i * 22}%` }}
        />
      ))}

      <div className="cq-node-actions">
        <button type="button" className="cq-node-action" onClick={(e) => { e.stopPropagation(); safe.onRunNode?.(nodeId) }} title="Test this step" disabled={disabled}>
          <Play size={13} />
        </button>
        <button type="button" className={`cq-node-action ${disabled ? 'cq-node-action--off' : ''}`} onClick={(e) => { e.stopPropagation(); safe.onToggleNode?.(nodeId) }} title={disabled ? 'Enable' : 'Disable'}>
          <Power size={13} />
        </button>
        <button type="button" className="cq-node-action cq-node-action--danger" onClick={(e) => { e.stopPropagation(); safe.onDeleteNode?.(nodeId) }} title="Delete">
          <Trash2 size={13} />
        </button>
        <button type="button" className="cq-node-action" onClick={(e) => { e.stopPropagation(); safe.onOpenMoreMenu?.(nodeId, e) }} title="More">
          <MoreHorizontal size={13} />
        </button>
      </div>

      <div className="cq-node-card">
        <div className="cq-node-accent" />
        <div className="cq-node-body">
          <div className="cq-node-icon" style={isTrigger ? { color } : undefined}>
            <NodeIcon name={icon} size={isTrigger ? 20 : 18} color={isTrigger ? color : '#fff'} />
          </div>
          <div className="cq-node-content">
            <span className="cq-node-category">{meta.label}</span>
            <div className="cq-node-title">{title}</div>
            {subtitle && subtitle !== title && (
              <div className="cq-node-subtitle">{subtitle}</div>
            )}
          </div>
          {showWarning && (
            <span className="cq-node-warning" title="Connect a chat model">
              <NodeIcon name="alert-triangle" size={14} color="#f59e0b" />
            </span>
          )}
        </div>

        {(status || isTrigger || isChat) && (
          <div className={`cq-node-footer ${isTrigger ? 'cq-node-footer--trigger' : ''}`}>
            {status && !isTrigger && (
              <>
                {stepNumber != null && <span className="cq-node-step">{stepNumber}</span>}
                <span className={`cq-node-status-dot cq-node-status-dot--${status}`} />
                <span>
                  {status === 'success' ? 'Done' : status === 'error' ? 'Failed' : status === 'running' ? 'Running' : status}
                  {duration != null && ` · ${Number(duration).toFixed(0)}ms`}
                </span>
              </>
            )}
            {isTrigger && (
              <button
                type="button"
                className="cq-node-run-btn"
                onClick={(e) => { e.stopPropagation(); safe.onExecuteWorkflow?.(safe._nodeId || nodeId) }}
              >
                <Play size={12} fill="currentColor" />
                Run workflow
              </button>
            )}
            {isChat && !isTrigger && (
              <button
                type="button"
                className="cq-node-run-btn"
                style={{ marginLeft: 'auto' }}
                onClick={(e) => { e.stopPropagation(); safe.onOpenChat?.(nodeId) }}
              >
                <MessageSquare size={12} />
                Open chat
              </button>
            )}
          </div>
        )}
      </div>

      {hasMainOutput && (
        <>
          <Handle type="source" position={Position.Right} id="main-out" className="cq-handle cq-handle--main-out" />
          <button
            type="button"
            className="cq-node-add"
            onClick={(e) => { e.stopPropagation(); safe.onAddAfter?.(safe._nodeId || nodeId) }}
            title="Add next step"
          >
            <Plus size={14} />
          </button>
        </>
      )}

      {hasAiOutput && outputs.filter((o) => AI_TYPES.includes(o)).map((outType) => (
        <Handle
          key={outType}
          type="source"
          position={Position.Top}
          id={`${outType}-out`}
          className="cq-handle cq-handle--ai cq-handle--ai-out"
          style={{ background: AI_COLORS[outType], '--handle-color': AI_COLORS[outType] }}
        />
      ))}

      {aiInputs.length > 0 && (
        <div className="cq-node-ai-slots">
          {aiInputs.map((inputType) => (
            <div key={inputType} className="cq-node-ai-slot">
              <Handle
                type="target"
                position={Position.Bottom}
                id={`${inputType}-in`}
                className="cq-handle cq-handle--ai cq-handle--ai-in"
                style={{ background: AI_COLORS[inputType], '--handle-color': AI_COLORS[inputType] }}
              />
              <button
                type="button"
                className="cq-node-ai-pill"
                style={{ '--slot-color': AI_COLORS[inputType] }}
                onClick={(e) => { e.stopPropagation(); safe.onAddAiSubNode?.(nodeId, inputType) }}
              >
                <span className="cq-node-ai-pill-dot" />
                {slotLabel(inputType)}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const WorkflowNode = memo(WorkflowNodeInner)
