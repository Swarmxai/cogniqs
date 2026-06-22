/**
 * WorkflowNode — Custom ReactFlow node (ported from mindscrybe).
 * - Toolbar (Play, Power, Trash, More) on every node
 * - Trigger: red lightning button (execute), large icon, caption below
 * - Add-next: line + "1 item." + grey plus
 * - Green tick at bottom-right after execution
 * - AI Agent bottom handles for LLM, Tools, Memory
 */

import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plus, Play, Pause, Trash2, MoreHorizontal, Zap, MessageSquare } from 'lucide-react';
import { NodeIcon } from './icons/NodeIcons';

/** Manual Trigger: defaults.name = "When clicking 'Execute workflow'", defaults.color = '#909298' */
const TRIGGER_DEFAULT_NAMES = {
  manual_trigger: "When clicking 'Execute workflow'",
  webhook_trigger: 'When receiving an HTTP request',
  schedule_trigger: 'On a schedule',
  chat_trigger: 'When a chat message is received',
  error_trigger: 'When a workflow error occurs',
  slack_trigger: 'When a Slack event is received',
};
/** Manual Trigger uses grey; other triggers can use group color */
const TRIGGER_DEFAULT_COLORS = {
  manual_trigger: '#909298',
};

const GROUP_COLORS = {
  trigger: '#10b981',
  action: '#3b82f6',
  transform: '#f59e0b',
  logic: '#3ab54a',
  ai_model: '#10a37f',
  ai_tool: '#3ab54a',
  ai_memory: '#0ea5e9',
};

const AI_INPUT_TYPES = ['ai_languageModel', 'ai_agent', 'ai_tool', 'ai_memory', 'ai_outputParser', 'ai_embedding', 'ai_embeddings', 'ai_vectorStore', 'ai_retriever'];
const AI_INPUT_LABELS = {
  ai_languageModel: 'Chat Model',
  ai_agent: 'Agent',
  ai_tool: 'Tool',
  ai_memory: 'Memory',
  ai_outputParser: 'Output Parser',
  ai_embedding: 'Embed',
  ai_embeddings: 'Embed',
  ai_vectorStore: 'VecStore',
  ai_retriever: 'Retriever',
};
const AI_INPUT_REQUIRED = { ai_languageModel: true };
const AI_INPUT_COLORS = {
  ai_languageModel: '#10a37f',
  ai_agent: '#3ab54a',
  ai_tool: '#3ab54a',
  ai_memory: '#0ea5e9',
  ai_outputParser: '#059669',
  ai_embedding: '#059669',
  ai_embeddings: '#059669',
  ai_vectorStore: '#3ab54a',
  ai_retriever: '#f59e0b',
};

function WorkflowNodeInner({ data, selected, id: nodeId }) {
  const [hovered, setHovered] = useState(false);
  const safeData = data || {};
  const desc = safeData._desc || {};
  const group = desc.group || 'action';
  const isTrigger = group === 'trigger';
  const isChatNode = desc.name === 'chat_node';
  const color = isTrigger && TRIGGER_DEFAULT_COLORS[desc.name]
    ? TRIGGER_DEFAULT_COLORS[desc.name]
    : (desc.color || GROUP_COLORS[group] || '#3ab54a');
  const icon = desc.icon || 'zap';
  const nodeResult = safeData._nodeResult;
  const stepNumber = safeData._stepNumber;
  const rawStatus = (nodeResult?.output?.status || nodeResult?.status || '').toLowerCase();
  // Normalize: backend may return "failed" / "FAILED" — treat same as "error"
  const status = (rawStatus === 'failed') ? 'error' : rawStatus || undefined;


  const inputs = desc.inputs || ['main'];
  const aiInputs = inputs.filter((i) => AI_INPUT_TYPES.includes(i));
  const mainInputCount = isTrigger ? 0 : inputs.filter((i) => i === 'main').length;
  const hasMainInput = mainInputCount > 0;

  const outputs = desc.outputs || ['main'];
  const hasAiOutput = outputs.some((o) => AI_INPUT_TYPES.includes(o));
  const hasMainOutput = outputs.includes('main');

  const connectedAi = safeData._connectedAiInputs || [];
  const needsChatModel = aiInputs.includes('ai_languageModel');
  const hasChatModel = connectedAi.includes('ai_languageModel');
  const showAgentWarning = aiInputs.length > 0 && needsChatModel && !hasChatModel;

  const p = safeData.parameters || {};
  let label = safeData.customName || desc.displayName || safeData.label || 'Node';
  let subtitle = desc.name;
  const customDesc = safeData.description || '';
  if (desc.name === 'http_request' && p.url) {
    const method = (p.method || 'GET').toUpperCase();
    const url = p.url.replace(/^https?:\/\//, '').slice(0, 20);
    label = `${method} ${url}`;
  }
  if (desc.name === 'ai_agent') {
    const agentTypeLabels = { toolsAgent: 'Tools Agent', conversationalAgent: 'Conversational Agent', openAiFunctionsAgent: 'OpenAI Functions Agent', planAndExecuteAgent: 'Plan and Execute Agent' };
    subtitle = agentTypeLabels[p.agent_type] || 'Tools Agent';
  }

  const isDisabled = safeData.disabled === true;
  /** Caption below trigger card (reference: "When clicking 'Execute workflow'") */
  const triggerCaption = isTrigger && TRIGGER_DEFAULT_NAMES[desc.name]
    ? TRIGGER_DEFAULT_NAMES[desc.name]
    : null;
  const triggerMainIcon = desc.name === 'manual_trigger' ? 'mouse-pointer-2' : icon;

  const inputNames = desc.inputNames || [];
  const fullInputs = desc.inputs || ['main'];
  const getSlotLabel = (inputType) => {
    const idx = fullInputs.indexOf(inputType);
    const name = (idx >= 0 && inputNames[idx]) ? inputNames[idx] : (AI_INPUT_LABELS[inputType] || inputType);
    const required = AI_INPUT_REQUIRED[inputType];
    return required ? `${name}*` : name;
  };

  const isSupportNode = hasAiOutput && !hasMainOutput;

  // Build status icon text
  const statusIcon = status === 'success' ? '✓' : status === 'error' || status === 'timeout' ? '✕' : status === 'skipped' ? '⊘' : status === 'running' ? '●' : status === 'stopped' ? '■' : null;

  return (
    <div
      className={`wf-node ${selected ? 'wf-node--selected' : ''} ${isTrigger ? 'wf-node--trigger' : ''} ${aiInputs.length > 0 ? 'wf-node--agent' : ''} ${hasAiOutput ? 'wf-node--subnodel' : ''} ${isSupportNode ? 'wf-node--circular' : ''} ${isDisabled ? 'wf-node--disabled' : ''}`}
      data-status={status || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ '--node-color': color }}
    >
      {hasMainInput && mainInputCount === 1 && (
        <Handle type="target" position={Position.Left} id="main-in" className="wf-handle wf-handle--input" />
      )}

      {hasMainInput && mainInputCount > 1 && (
        <div className="wf-node-multi-inputs">
          {Array.from({ length: mainInputCount }, (_, i) => {
            const name = inputNames[i] || '';
            return (
              <div key={i} className="wf-node-multi-input-slot">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`main-in-${i}`}
                  className="wf-handle wf-handle--input wf-handle--multi"
                />
                {name && <span className="wf-node-multi-input-label">{name}</span>}
              </div>
            );
          })}
        </div>
      )}

      {!isSupportNode && (
        <div className="wf-node-card" data-status={status || undefined}>
          {/* Single row — left: icon + content, right: toolbar */}
          <div className={`wf-node-card-body ${isTrigger ? 'wf-node-card-body--trigger' : ''}`}>
            {isTrigger ? (
              <div className="wf-node-trigger-icon-wrap">
                <NodeIcon name={triggerMainIcon} size={28} color="var(--trigger-icon-grey, #6b7280)" />
              </div>
            ) : (
              <>
                <div className="wf-node-icon" style={{ background: color }}>
                  <NodeIcon name={icon} size={16} color="#fff" />
                </div>
                <div className="wf-node-info">
                  <div className="wf-node-label">{label}</div>
                  <div className="wf-node-type">{aiInputs.length > 0 ? subtitle : (desc.displayName || desc.name)}</div>
                  {customDesc && <div className="wf-node-desc" title={customDesc}>{customDesc}</div>}
                </div>
                {showAgentWarning && (
                  <div className="wf-node-warning" title="Connect a Chat Model to this agent">
                    <NodeIcon name="alert-triangle" size={16} color="var(--color-warning)" />
                  </div>
                )}
              </>
            )}
          </div>
          <div className={`wf-node-toolbar wf-node-toolbar--inline ${hovered || selected ? 'wf-node-toolbar--visible' : ''}`}>
            <button type="button" className="wf-node-toolbar-btn" onClick={(e) => { e.stopPropagation(); safeData.onRunNode?.(nodeId); }} title="Execute node" disabled={isDisabled} aria-disabled={isDisabled}>
              <Play size={14} />
            </button>
            <button type="button" className={`wf-node-toolbar-btn wf-node-toolbar-btn--toggle ${isDisabled ? 'wf-node-toolbar-btn--off' : ''}`} onClick={(e) => { e.stopPropagation(); safeData.onToggleNode?.(nodeId); }} title={isDisabled ? 'Enable node' : 'Disable node'} aria-pressed={isDisabled}>
              {isDisabled ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button type="button" className="wf-node-toolbar-btn" onClick={(e) => { e.stopPropagation(); safeData.onDeleteNode?.(nodeId); }} title="Delete node">
              <Trash2 size={14} />
            </button>
            <button type="button" className="wf-node-toolbar-btn" onClick={(e) => { e.stopPropagation(); safeData.onOpenMoreMenu?.(nodeId, e); }} title="More options">
              <MoreHorizontal size={14} />
            </button>
          </div>
          {/* Status badge — positioned at bottom-right of card */}
          {status && statusIcon && (
            <div className={`wf-node-status wf-node-status--card-bottom-right wf-node-status--${status}`} title={nodeResult?.error || status}>
              {statusIcon}
            </div>
          )}
          {/* Red lightning button inside card — click to execute trigger */}
          {isTrigger && (
            <button
              type="button"
              className="wf-node-trigger-pin"
              onClick={(e) => {
                e.stopPropagation();
                safeData.onExecuteWorkflow?.(safeData._nodeId || nodeId);
              }}
              title="Execute workflow from this node"
              aria-label="Execute workflow from this node"
            >
              <Zap size={10} color="#fff" strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* Status strip below card — always visible after execution */}
      {!isSupportNode && status && status !== 'running' && (
        <div className={`wf-node-status-strip wf-node-status-strip--${status}`}>
          {stepNumber != null && <span className="wf-node-step-badge">{stepNumber}</span>}
          <span className="wf-node-status-strip-icon">{statusIcon}</span>
          <span className="wf-node-status-strip-label">
            {status === 'success' ? 'Success' : status === 'error' ? 'Error' : status === 'timeout' ? 'Timeout' : status === 'skipped' ? 'Skipped' : status}
          </span>
          {(nodeResult?.durationMs ?? nodeResult?.duration_ms) != null && (
            <span className="wf-node-status-strip-time">{Number(nodeResult.durationMs ?? nodeResult.duration_ms).toFixed(0)}ms</span>
          )}
        </div>
      )}
      {!isSupportNode && status === 'running' && (
        <div className="wf-node-status-strip wf-node-status-strip--running">
          {stepNumber != null && <span className="wf-node-step-badge">{stepNumber}</span>}
          <span className="wf-node-status-strip-icon">●</span>
          <span className="wf-node-status-strip-label">
            {stepNumber != null
              ? (nodeResult?.progress?.total > 0
                  ? `Step ${stepNumber} · ${nodeResult.progress.percent}%`
                  : `Step ${stepNumber} · Running…`)
              : 'Running…'}
          </span>
          <div className="wf-node-progress-bar">
            <div
              className="wf-node-progress-fill"
              style={{ width: `${nodeResult?.progress?.percent ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {isTrigger && triggerCaption && (
        <div className="wf-node-trigger-caption">{triggerCaption}</div>
      )}

      {isChatNode && (
        <button
          type="button"
          className="wf-node-chat-open-btn"
          onClick={(e) => {
            e.stopPropagation();
            safeData.onOpenChat?.(nodeId);
          }}
          title="Open chat popup"
          aria-label="Open chat"
        >
          <MessageSquare size={11} strokeWidth={2.5} />
          <span>Open Chat</span>
        </button>
      )}

      {isSupportNode && (
        <div className="wf-node-circular-wrap">
          <div className={`wf-node-toolbar wf-node-toolbar--circular ${hovered || selected ? 'wf-node-toolbar--visible' : ''}`}>
            <button type="button" className="wf-node-toolbar-btn" onClick={(e) => { e.stopPropagation(); safeData.onRunNode?.(nodeId); }} title="Execute node" disabled={isDisabled} aria-disabled={isDisabled}>
              <Play size={14} />
            </button>
            <button type="button" className={`wf-node-toolbar-btn wf-node-toolbar-btn--toggle ${isDisabled ? 'wf-node-toolbar-btn--off' : ''}`} onClick={(e) => { e.stopPropagation(); safeData.onToggleNode?.(nodeId); }} title={isDisabled ? 'Enable node' : 'Disable node'} aria-pressed={isDisabled}>
              {isDisabled ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button type="button" className="wf-node-toolbar-btn" onClick={(e) => { e.stopPropagation(); safeData.onDeleteNode?.(nodeId); }} title="Delete node">
              <Trash2 size={14} />
            </button>
            <button type="button" className="wf-node-toolbar-btn" onClick={(e) => { e.stopPropagation(); safeData.onOpenMoreMenu?.(nodeId, e); }} title="More options">
              <MoreHorizontal size={14} />
            </button>
          </div>
          <div className="wf-node-circular" data-status={status || undefined}>
            <div className="wf-node-circular-icon" style={{ background: color }}>
              <NodeIcon name={icon} size={24} color="#fff" />
            </div>
            {status && statusIcon && (
              <div className={`wf-node-status wf-node-status--circular wf-node-status--${status}`} title={nodeResult?.error || status}>
                {statusIcon}
              </div>
            )}
          </div>
          <div className="wf-node-circular-label">{label}</div>
          {subtitle && subtitle !== desc.name && (
            <div className="wf-node-circular-subtitle">{subtitle}</div>
          )}
        </div>
      )}

      {hasMainOutput && (
        <Handle type="source" position={Position.Right} id="main-out" className="wf-handle wf-handle--output" />
      )}

      {hasAiOutput && outputs.filter((o) => AI_INPUT_TYPES.includes(o)).map((outType) => (
        <Handle
          key={outType}
          type="source"
          position={Position.Top}
          id={`${outType}-out`}
          className={`wf-handle wf-handle--ai-out wf-handle--${outType}`}
          style={{ background: AI_INPUT_COLORS[outType] || '#888' }}
        />
      ))}

      {aiInputs.length > 0 && (
        <div className="wf-node-ai-inputs">
          {aiInputs.map((inputType) => (
            <div key={inputType} className="wf-node-ai-slot">
              <Handle
                type="target"
                position={Position.Bottom}
                id={`${inputType}-in`}
                className={`wf-handle wf-handle--ai wf-handle--${inputType}`}
                style={{ background: AI_INPUT_COLORS[inputType] || '#888' }}
              />
              <button
                type="button"
                className="wf-node-ai-label-btn"
                style={{ '--ai-color': AI_INPUT_COLORS[inputType] || '#888' }}
                onClick={(e) => {
                  e.stopPropagation();
                  safeData.onAddAiSubNode?.(nodeId, inputType);
                }}
                title={`Add or connect ${getSlotLabel(inputType).replace('*', '')}`}
              >
                {getSlotLabel(inputType)}
              </button>
            </div>
          ))}
        </div>
      )}

      {!isSupportNode && hasMainOutput && (
        <div className={`wf-node-add-next ${hovered || selected ? 'wf-node-add-next--visible' : ''}`}>
          <span className="wf-node-add-next-line" aria-hidden />
          <span className="wf-node-add-next-label">1 item.</span>
          <button
            type="button"
            className="wf-node-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              safeData.onAddAfter?.(safeData._nodeId);
            }}
            title="Add next step"
          >
            <Plus size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeInner);
