/**
 * NodeSelectorPanel — Right-side modal panel for selecting nodes (ported from mindscrybe).
 * Supports AI subcategories: Agents, LLMs, Tools, Memory.
 *
 * mode can be:
 *   "trigger"         — only show trigger nodes
 *   "all"             — show all categories
 *   "analysis"        — bias toward analysis nodes
 *   "ai_languageModel" — only LLM nodes
 *   "ai_tool"         — only Tool nodes
 *   "ai_memory"       — only Memory nodes
 */

import { useState, useMemo } from 'react';
import { X, ChevronLeft, Search, ChevronRight, Star } from 'lucide-react';
import { NodeIcon } from './icons/NodeIcons';

/** Registered analysis node types (fallback when API group metadata is missing). */
const ANALYSIS_NODE_NAMES = new Set([
  'eda_report',
  'dataset_merge',
  'feature_transform',
  'clustering_suite',
  'anomaly_detection',
  'drift_monitor',
  'time_series_studio',
  'time_series_forecast',
  'fft_analysis',
  'market_basket',
  'model_evaluation',
]);

function isAnalysisNode(desc) {
  return desc?.group === 'analysis' || ANALYSIS_NODE_NAMES.has(desc?.name);
}

/** "What happens next?" — exact order and copy from reference design */
const WHAT_HAPPENS_NEXT_CATEGORIES = [
  { key: 'ai',        label: 'AI',                       icon: 'bot',          description: 'Build autonomous agents, summarize or search documents, etc.' },
  { key: 'ml',        label: 'AI/ML Training & Inference',  icon: 'cpu',          description: 'Configure datasets, train models, and run predictions' },
  { key: 'analysis',  label: 'Analysis & EDA',          icon: 'bar-chart-2',  description: 'Explore datasets, compare schemas, detect anomalies, and evaluate forecasts' },
  { key: 'action',    label: 'Action in an app',        icon: 'globe',        description: 'Do something in an app or service like Google Sheets, Telegram or Notion' },
  { key: 'transform', label: 'Data transformation',     icon: 'edit-3',       description: 'Manipulate, filter or convert data' },
  { key: 'logic',     label: 'Flow',                    icon: 'git-branch',   description: 'Branch, merge or loop the flow, etc.' },
  { key: 'core',      label: 'Core',                    icon: 'briefcase',    description: 'Run code, make HTTP requests, set webhooks, etc.' },
  { key: 'human_review', label: 'Human review',          icon: 'check-circle', description: 'Request approval via services like Slack and Telegram before making tool calls' },
  { key: 'trigger',   label: 'Add another trigger',    icon: 'zap',          description: 'Triggers start your workflow. Workflows can have multiple triggers.' },
];

/** Trigger node descriptions for "What triggers this workflow?" */
const TRIGGER_DESCRIPTIONS = {
  manual_trigger: "Runs the flow on clicking a button. Good for getting started quickly.",
  webhook_trigger: "Runs the flow on receiving an HTTP request.",
  schedule_trigger: "Runs the flow every day, hour, or custom interval.",
  chat_trigger: "Runs the flow when a chat message is received.",
  error_trigger: "Runs the flow when a workflow encounters an error.",
  slack_trigger: "Runs the flow when a Slack event is received.",
  teams_trigger: "Runs the flow when a Microsoft Teams event is received.",
};

/** Fixed trigger options list (reference design) — show all 8; nodeName = backend node to add, or null for "coming soon" */
const TRIGGER_OPTIONS = [
  { id: 'manual',       label: 'Trigger manually',                    nodeName: 'manual_trigger',   icon: 'play-circle', showArrow: false, description: 'Runs the flow on clicking a button. Good for getting started quickly.' },
  { id: 'app-event',    label: 'On app event',                        nodeName: null,               icon: 'activity',   showArrow: true,  description: 'Runs the flow when something happens in an app like Telegram, Notion or Airtable.' },
  { id: 'schedule',     label: 'On a schedule',                      nodeName: 'schedule_trigger',  icon: 'clock',      showArrow: false, description: 'Runs the flow every day, hour, or custom interval.' },
  { id: 'webhook',      label: 'On webhook call',                     nodeName: 'webhook_trigger',  icon: 'link',       showArrow: false, description: 'Runs the flow on receiving an HTTP request.' },
  { id: 'api',          label: 'On API call',                         nodeName: 'api_trigger',      icon: 'zap',        showArrow: false, description: 'Runs the flow on an API request. Supports HTTP, WebSocket, SSE, ZMQ, and gRPC.' },
  { id: 'form',         label: 'On form submission',                 nodeName: null,               icon: 'file-text',  showArrow: false, description: 'Generate webforms and pass their responses to the workflow.' },
  { id: 'subworkflow',  label: 'When executed by another workflow',  nodeName: null,               icon: 'git-branch', showArrow: false, description: 'Runs the flow when called by the Execute Workflow node from a different workflow.' },
  { id: 'chat',         label: 'On chat message',                     nodeName: 'chat_trigger',     icon: 'message-square', showArrow: false, description: 'Runs the flow when a user sends a chat message. For use with AI nodes.' },
  { id: 'teams',        label: 'On Microsoft Teams event',            nodeName: 'teams_trigger',    icon: 'microsoft-teams', showArrow: false, description: 'Runs the flow when a Microsoft Teams event is received via webhook or Graph API.' },
  { id: 'other',        label: 'Other ways...',                       nodeName: 'error_trigger',    icon: 'layers',     showArrow: true,  description: 'Runs the flow on workflow errors, file changes, etc.' },
];

const AI_SUBCATEGORIES = [
  { key: 'ai_agent',       group: 'action',        filter: (n) => n.name === 'ai_agent' || n.name === 'supervisor_agent', label: 'AI Agents', description: 'Autonomous reasoning agents & supervisors', icon: 'bot', color: '#3ab54a' },
  { key: 'ai_chains',      group: 'action',        filter: (n) => ['basic_llm_chain','qa_chain','summarization_chain','information_extractor','text_classifier','sentiment_analysis','rag_document_qa','document_ingest','multimodal_ingest','multimodal_rag_qa'].includes(n.name), label: 'AI Chains', description: 'LLM Chain, QA, RAG, Multimodal RAG, Summarize', icon: 'activity', color: '#3ab54a' },
  { key: 'ai_model',       group: 'ai_model',      filter: (n) => n.group === 'ai_model',              label: 'Chat Models',    description: '9 LLMs: OpenAI, Gemini, Groq, Azure...', icon: 'cpu',    color: '#10a37f' },
  { key: 'ai_tool',        group: 'ai_tool',       filter: (n) => n.group === 'ai_tool',               label: 'Agent Tools',    description: 'HTTP, Code, Calculator, Wiki',   icon: 'wrench',    color: '#3ab54a' },
  { key: 'ai_memory',      group: 'ai_memory',     filter: (n) => n.group === 'ai_memory',             label: 'Memory',         description: 'Conversation memory stores',     icon: 'database',  color: '#0ea5e9' },
  { key: 'ai_embedding',   group: 'ai_embedding',  filter: (n) => n.group === 'ai_embedding',          label: 'Embeddings',     description: 'OpenAI, Ollama embeddings',      icon: 'cpu',       color: '#059669' },
  { key: 'ai_vectorStore', group: 'ai_vectorStore', filter: (n) => n.group === 'ai_vectorStore',       label: 'Vector Stores',  description: 'Store & search embeddings',      icon: 'database',  color: '#3ab54a' },
  { key: 'ai_retriever',   group: 'ai_retriever',  filter: (n) => n.group === 'ai_retriever',          label: 'Retrievers',     description: 'Retrieve relevant documents',    icon: 'search',    color: '#f59e0b' },
  { key: 'ai_outputParser', group: 'ai_outputParser', filter: (n) => n.group === 'ai_outputParser',    label: 'Output Parsers', description: 'Structured, List parsers',       icon: 'code',      color: '#059669' },
];

const AI_GROUPS = ['ai_model', 'ai_tool', 'ai_memory', 'ai_embedding', 'ai_vectorStore', 'ai_retriever', 'ai_outputParser'];
const AI_CHAIN_NAMES = ['basic_llm_chain','qa_chain','summarization_chain','information_extractor','text_classifier','sentiment_analysis','rag_document_qa','document_ingest','multimodal_ingest','multimodal_rag_qa'];

/** Map typed handle modes to the groups they should show */
const HANDLE_MODE_MAP = {
  ai_languageModel: 'ai_model',
  ai_agent: 'ai_agent',
  ai_tool: 'ai_tool',
  ai_memory: 'ai_memory',
  ai_embedding: 'ai_embedding',
  ai_vectorStore: 'ai_vectorStore',
  ai_retriever: 'ai_retriever',
  ai_outputParser: 'ai_outputParser',
};

export function NodeSelectorPanel({ open, mode, nodeDescriptions, onSelect, onClose, asSidebar }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [showPopular, setShowPopular] = useState(false);

  // When used as sidebar (empty workflow), always show; otherwise respect open
  const isVisible = asSidebar || open;
  // If mode is a typed handle mode, directly show only that group
  const isHandleMode = !!HANDLE_MODE_MAP[mode];
  const handleGroup = HANDLE_MODE_MAP[mode];
  const isAnalysisMode = mode === 'analysis';

  /** Popular node names — frequently used nodes shown first */
  const POPULAR_NODES = ['http_request', 'code', 'set', 'if_node', 'ai_agent', 'openai_chat', 'slack_send_message', 'webhook_trigger', 'schedule_trigger', 'basic_llm_chain', 'eda_report', 'anomaly_detection', 'time_series_forecast'];

  /** Compute counts per category */
  const categoryCounts = useMemo(() => {
    const descs = nodeDescriptions || [];
    return {
      ai: descs.filter(n => n.name === 'ai_agent' || n.name === 'supervisor_agent' || AI_GROUPS.includes(n.group) || AI_CHAIN_NAMES.includes(n.name)).length,
      ml: descs.filter(n => n.group === 'ml').length,
      analysis: descs.filter(isAnalysisNode).length,
      action: descs.filter(n => n.group === 'action' && n.name !== 'ai_agent' && n.name !== 'supervisor_agent' && !AI_CHAIN_NAMES.includes(n.name)).length,
      transform: descs.filter(n => n.group === 'transform').length,
      logic: descs.filter(n => n.group === 'logic').length,
      core: ['http_request', 'code', 'set', 'if_node', 'webhook_trigger'].filter(name => descs.some(n => n.name === name)).length,
      trigger: descs.filter(n => n.group === 'trigger').length,
      popular: POPULAR_NODES.filter(name => descs.some(n => n.name === name)).length,
    };
  }, [nodeDescriptions]);

  const filteredNodes = useMemo(() => {
    const q = search.toLowerCase();
    const descs = nodeDescriptions || [];

    // Handle mode: only show nodes whose group matches
    if (isHandleMode) {
      return descs.filter(
        (n) => {
          // Special case: ai_agent handle shows agent nodes (group=action, agent names)
          const groupMatch = handleGroup === 'ai_agent'
            ? (n.name === 'ai_agent' || n.name === 'supervisor_agent')
            : n.group === handleGroup;
          return groupMatch &&
            (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q));
        }
      );
    }

    if (!q && !selectedCategory && !showPopular && !isAnalysisMode) return null;

    // Popular nodes view
    if (showPopular) {
      return descs.filter(
        (n) =>
          POPULAR_NODES.includes(n.name) &&
          (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q))
      ).sort((a, b) => POPULAR_NODES.indexOf(a.name) - POPULAR_NODES.indexOf(b.name));
    }

    // AI subcategory
    if (selectedCategory?.startsWith('ai_')) {
      const subcat = AI_SUBCATEGORIES.find((s) => s.key === selectedCategory);
      if (subcat) {
        return descs.filter(
          (n) =>
            subcat.filter(n) &&
            (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q))
        );
      }
    }

    if (selectedCategory === 'ai') {
      return descs.filter(
        (n) =>
          (n.name === 'ai_agent' || n.name === 'supervisor_agent' || AI_GROUPS.includes(n.group) || AI_CHAIN_NAMES.includes(n.name)) &&
          (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q))
      );
    }

    if (selectedCategory === 'core') {
      const coreNames = ['http_request', 'code', 'set', 'if_node', 'webhook_trigger'];
      return descs.filter(
        (n) =>
          coreNames.includes(n.name) &&
          (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q))
      );
    }

    if (selectedCategory === 'analysis') {
      return descs.filter(
        (n) =>
          isAnalysisNode(n) &&
          (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q))
      ).sort((a, b) => {
        const priority = ['eda_report', 'dataset_merge', 'anomaly_detection', 'drift_monitor', 'time_series_forecast', 'model_evaluation'];
        const ai = priority.indexOf(a.name);
        const bi = priority.indexOf(b.name);
        if (ai === -1 && bi === -1) return (a.displayName || '').localeCompare(b.displayName || '');
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }

    if (isAnalysisMode) {
      return descs.filter(
        (n) =>
          isAnalysisNode(n) &&
          (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q))
      );
    }

    if (selectedCategory === 'human_review') {
      return descs.filter(
        (n) =>
          (n.name || '').toLowerCase().includes('review') || (n.name || '').toLowerCase().includes('approval') ||
          (!q && false)
      );
    }

    if (selectedCategory) {
      return descs.filter(
        (n) =>
          n.group === selectedCategory &&
          (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q))
      );
    }

    // Global search
    return descs.filter(
      (n) =>
        (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q)
    );
  }, [nodeDescriptions, selectedCategory, search, mode, isHandleMode, handleGroup, showPopular, isAnalysisMode]);

  const handleSelect = (desc) => {
    onSelect(desc);
    setSelectedCategory(null);
    setSearch('');
    setShowPopular(false);
  };

  const handleBack = () => {
    if (showPopular) {
      setShowPopular(false);
      setSearch('');
    } else if (selectedCategory?.startsWith('ai_') && !isHandleMode) {
      setSelectedCategory('ai');
      setSearch('');
    } else {
      setSelectedCategory(null);
      setSearch('');
    }
  };

  if (!isVisible) return null;

  // Conversational titles
  let title = 'What happens next?';
  let subtitle = null;
  if (mode === 'trigger' && !selectedCategory && !search) {
    title = 'What triggers this workflow?';
    subtitle = 'A trigger is a step that starts your workflow';
  } else if (isAnalysisMode && !selectedCategory && !search) {
    title = 'Analysis & EDA';
    subtitle = 'Explore, diagnose, compare, and evaluate datasets';
  } else if (mode === 'trigger' && selectedCategory === 'trigger') {
    title = 'What triggers this workflow?';
    subtitle = 'A trigger is a step that starts your workflow';
  } else if (!selectedCategory && !search && !isHandleMode) {
    title = 'What happens next?';
    subtitle = `${(nodeDescriptions || []).length} nodes available`;
  }
  if (isHandleMode) {
    title = 'AI Nodes';
    subtitle = 'Select an AI Node to add to your workflow';
  }
  if (showPopular) {
    title = 'Popular';
    subtitle = 'Frequently used nodes to get started fast';
  }
  if (selectedCategory && (search || selectedCategory !== 'trigger')) {
    if (selectedCategory === 'ai') {
      title = 'AI';
      subtitle = 'Build autonomous agents, summarize or search documents, etc.';
    } else {
      const cat = [...WHAT_HAPPENS_NEXT_CATEGORIES, ...AI_SUBCATEGORIES].find((c) => c.key === selectedCategory);
      if (cat) {
        title = cat.label;
        subtitle = cat.description;
      }
    }
  }

  const showCategories = !selectedCategory && !search && !isHandleMode && !showPopular && !isAnalysisMode;
  const showTriggerOptions = mode === 'trigger' && !selectedCategory && !search && !showPopular;
  const showAiSubcategories = selectedCategory === 'ai' && !search && !showPopular;

  const displayCategories = mode === 'trigger' ? [] : WHAT_HAPPENS_NEXT_CATEGORIES;

  const handleTriggerOptionClick = (opt) => {
    if (!opt.nodeName) return; // Coming soon
    const desc = (nodeDescriptions || []).find((n) => n.name === opt.nodeName);
    if (desc) handleSelect(desc);
  };

  const panelContent = (
    <>
      {/* Header */}
      <div className="node-selector-header">
        {(selectedCategory || isHandleMode || showPopular) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={isHandleMode ? onClose : handleBack}
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div className="node-selector-header-text">
          <h3>{title}</h3>
          {subtitle && <p className="node-selector-subtitle">{subtitle}</p>}
        </div>
        {!asSidebar && (
          <button type="button" className="node-selector-close" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

        {/* Search */}
        <div className="node-selector-search">
          <Search size={14} className="node-selector-search-icon" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="node-selector-body">
          {showTriggerOptions ? (
            <ul className="node-selector-trigger-list">
              {TRIGGER_OPTIONS.map((opt) => {
                const available = !!opt.nodeName && (nodeDescriptions || []).some((n) => n.name === opt.nodeName);
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      className={`node-selector-trigger-option ${!available ? 'node-selector-trigger-option--disabled' : ''}`}
                      onClick={() => handleTriggerOptionClick(opt)}
                      disabled={!available}
                      title={!available ? 'Coming soon' : undefined}
                    >
                      <div className="node-selector-trigger-option-icon">
                        <NodeIcon name={opt.icon} size={20} color="#6b7280" />
                      </div>
                      <div className="node-selector-trigger-option-text">
                        <span className="node-selector-trigger-option-label">{opt.label}</span>
                        <span className="node-selector-trigger-option-desc">{opt.description}</span>
                      </div>
                      {opt.showArrow && (
                        <ChevronRight size={18} className="node-selector-trigger-option-arrow" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : showCategories ? (
            <ul className="node-selector-categories node-selector-categories--what-next">
              {/* Popular shortcut */}
              <li>
                <button
                  type="button"
                  className="node-selector-category node-selector-category--what-next"
                  onClick={() => setShowPopular(true)}
                >
                  <div className="node-selector-category-icon node-selector-category-icon--grey">
                    <Star size={20} color="#f59e0b" />
                  </div>
                  <div className="node-selector-category-info">
                    <div className="node-selector-category-label">Popular</div>
                    <div className="node-selector-category-desc">Most frequently used nodes</div>
                  </div>
                  <span className="node-selector-category-count">{categoryCounts.popular}</span>
                  <ChevronRight size={18} className="node-selector-category-arrow" />
                </button>
              </li>
              {displayCategories.map((cat) => (
                <li key={cat.key}>
                  <button
                    type="button"
                    className="node-selector-category node-selector-category--what-next"
                    onClick={() => setSelectedCategory(cat.key)}
                  >
                    <div className="node-selector-category-icon node-selector-category-icon--grey">
                      <NodeIcon name={cat.icon} size={20} color="#6b7280" />
                    </div>
                    <div className="node-selector-category-info">
                      <div className="node-selector-category-label">{cat.label}</div>
                      <div className="node-selector-category-desc">{cat.description}</div>
                    </div>
                    {categoryCounts[cat.key] !== undefined && (
                      <span className="node-selector-category-count">{categoryCounts[cat.key]}</span>
                    )}
                    <ChevronRight size={18} className="node-selector-category-arrow" />
                  </button>
                </li>
              ))}
            </ul>
          ) : showAiSubcategories ? (
            <div className="node-selector-categories">
              {AI_SUBCATEGORIES.map((sub) => {
                const count = (nodeDescriptions || []).filter(sub.filter).length;
                return (
                  <button
                    key={sub.key}
                    type="button"
                    className="node-selector-category node-selector-category--ai"
                    onClick={() => setSelectedCategory(sub.key)}
                  >
                    <div className="node-selector-category-icon" style={{ background: sub.color }}>
                      <NodeIcon name={sub.icon} size={18} color="#fff" />
                    </div>
                    <div className="node-selector-category-info">
                      <div className="node-selector-category-label">{sub.label}</div>
                      <div className="node-selector-category-desc">{sub.description}</div>
                    </div>
                    <span className="node-selector-category-count">{count}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={`node-selector-list ${isHandleMode ? 'node-selector-list--ai-nodes' : ''}`}>
              {(filteredNodes || []).length === 0 ? (
                <div className="node-selector-empty">No nodes found</div>
              ) : (
                (filteredNodes || []).map((desc) => {
                  const recommended = isHandleMode && (desc.name === 'ai_agent' || desc.name === 'openai_chat' || desc.name === 'anthropic_chat');
                  return (
                    <button
                      key={desc.name}
                      type="button"
                      className={`node-selector-item ${isHandleMode ? 'node-selector-item--ai-nodes' : ''}`}
                      onClick={() => handleSelect(desc)}
                    >
                      <div className={isHandleMode ? 'node-selector-item-icon node-selector-item-icon--grey' : 'node-selector-item-icon'} style={!isHandleMode ? { background: desc.color || '#3ab54a' } : undefined}>
                        <NodeIcon name={desc.icon || 'zap'} size={isHandleMode ? 20 : 16} color={isHandleMode ? '#6b7280' : '#fff'} />
                      </div>
                      <div className="node-selector-item-info">
                        <div className="node-selector-item-name-row">
                          <span className="node-selector-item-name">{desc.displayName || desc.name || 'Node'}</span>
                          {recommended && <span className="node-selector-item-pill">Recommended</span>}
                        </div>
                        <div className="node-selector-item-desc">
                          {mode === 'trigger' && TRIGGER_DESCRIPTIONS[desc.name]
                            ? TRIGGER_DESCRIPTIONS[desc.name]
                            : (desc.description || '')}
                        </div>
                      </div>
                      {isHandleMode && <ChevronRight size={18} className="node-selector-item-arrow" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
    </>
  );

  if (asSidebar) {
    return (
      <div className="node-selector-panel node-selector-panel--sidebar">
        {panelContent}
      </div>
    );
  }
  return (
    <div className="node-selector-overlay" onClick={onClose}>
      <div className="node-selector-panel" onClick={(e) => e.stopPropagation()}>
        {panelContent}
      </div>
    </div>
  );
}
