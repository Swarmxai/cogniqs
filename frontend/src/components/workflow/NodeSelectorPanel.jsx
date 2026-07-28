/**
 * NodeSelectorPanel — Cogniqs-branded right panel for picking workflow blocks.
 */

import { useState, useMemo } from 'react'
import { X, ChevronLeft, Search, ChevronRight } from 'lucide-react'
import { NodeIcon } from './icons/NodeIcons'
import {
  PANEL_SECTIONS,
  CATEGORY_BRAND,
  POPULAR_BRAND,
  AI_SUB_BRAND,
  TRIGGER_OPTIONS_BRAND,
  POPULAR_NODE_NAMES,
  AI_CHAIN_NAMES,
  AI_GROUPS,
  isAnalysisNode,
  applyNodeBrand,
  getCategoryBrand,
} from './nodeBranding'
import { adaptNode } from './nodeAdapter'

const HANDLE_MODE_MAP = {
  ai_languageModel: 'ai_model',
  ai_agent: 'ai_agent',
  ai_tool: 'ai_tool',
  ai_memory: 'ai_memory',
  ai_embedding: 'ai_embedding',
  ai_vectorStore: 'ai_vectorStore',
  ai_retriever: 'ai_retriever',
  ai_outputParser: 'ai_outputParser',
}

const HANDLE_MODE_TITLES = {
  ai_languageModel: { title: 'Pick a language model', subtitle: 'Connect an LLM to this agent slot' },
  ai_agent: { title: 'Pick an agent core', subtitle: 'Attach a reasoning agent' },
  ai_tool: { title: 'Pick a toolkit', subtitle: 'Give your agent callable tools' },
  ai_memory: { title: 'Pick context memory', subtitle: 'Store conversation history' },
  ai_embedding: { title: 'Pick embeddings', subtitle: 'Vectorize text for search' },
  ai_vectorStore: { title: 'Pick a vector vault', subtitle: 'Persist embedding indexes' },
  ai_retriever: { title: 'Pick a retriever', subtitle: 'Fetch relevant chunks' },
  ai_outputParser: { title: 'Pick output shaping', subtitle: 'Structure model responses' },
}

function TintedIcon({ icon, color, size = 20 }) {
  return (
    <div className="cq-panel-card-icon cq-panel-card-icon--tinted" style={{ '--icon-tint': color }}>
      <NodeIcon name={icon} size={size} color={color} />
    </div>
  )
}

function CategoryCard({ icon, color, title, description, onClick, disabled, showArrow = true }) {
  return (
    <button
      type="button"
      className={`cq-panel-card ${disabled ? 'cq-panel-card--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={{ '--card-accent': color }}
    >
      <TintedIcon icon={icon} color={color} />
      <div className="cq-panel-card-body">
        <div className="cq-panel-card-title">{title}</div>
        {description && <div className="cq-panel-card-desc">{description}</div>}
      </div>
      {showArrow && <ChevronRight size={18} className="cq-panel-card-arrow" />}
    </button>
  )
}

export function NodeSelectorPanel({ open, mode, nodeDescriptions, onSelect, onClose, asSidebar }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [showPopular, setShowPopular] = useState(false)

  const descs = useMemo(
    () => (nodeDescriptions || []).map((d) => adaptNode(applyNodeBrand(d))),
    [nodeDescriptions],
  )

  const isVisible = asSidebar || open
  const isHandleMode = !!HANDLE_MODE_MAP[mode]
  const handleGroup = HANDLE_MODE_MAP[mode]
  const isAnalysisMode = mode === 'analysis'

  const filteredNodes = useMemo(() => {
    const q = search.toLowerCase()

    if (isHandleMode) {
      return descs.filter((n) => {
        const groupMatch = handleGroup === 'ai_agent'
          ? (n.name === 'ai_agent' || n.name === 'supervisor_agent')
          : n.group === handleGroup
        return groupMatch && (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q))
      })
    }

    if (!q && !selectedCategory && !showPopular && !isAnalysisMode) return null

    if (showPopular) {
      return descs.filter((n) => POPULAR_NODE_NAMES.includes(n.name) && (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q)))
        .sort((a, b) => POPULAR_NODE_NAMES.indexOf(a.name) - POPULAR_NODE_NAMES.indexOf(b.name))
    }

    const subcat = AI_SUB_BRAND.find((s) => s.key === selectedCategory)
    if (subcat) {
      return descs.filter((n) => subcat.filter(n) && (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q)))
    }

    if (selectedCategory === 'ai') {
      return descs.filter((n) => (n.name === 'ai_agent' || n.name === 'supervisor_agent' || AI_GROUPS.includes(n.group) || AI_CHAIN_NAMES.includes(n.name)) && (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q)))
    }

    if (selectedCategory === 'core') {
      const coreNames = ['http_request', 'code_node', 'set_node', 'if_node', 'webhook_trigger']
      return descs.filter((n) => coreNames.includes(n.name) && (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q)))
    }

    if (selectedCategory === 'analysis' || isAnalysisMode) {
      return descs.filter((n) => isAnalysisNode(n) && (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q)))
    }

    if (selectedCategory === 'human_review') {
      return descs.filter((n) => (n.name || '').toLowerCase().includes('review') || (n.name || '').toLowerCase().includes('approval'))
    }

    if (selectedCategory) {
      return descs.filter((n) => n.group === selectedCategory && (!q || (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q)))
    }

    return descs.filter((n) => (n.displayName || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q))
  }, [descs, selectedCategory, search, isHandleMode, handleGroup, showPopular, isAnalysisMode])

  const handleSelect = (desc) => {
    onSelect(desc)
    setSelectedCategory(null)
    setSearch('')
    setShowPopular(false)
  }

  const handleBack = () => {
    if (showPopular) {
      setShowPopular(false)
      setSearch('')
    } else if (selectedCategory?.startsWith('ai_') && !isHandleMode) {
      setSelectedCategory('ai')
      setSearch('')
    } else {
      setSelectedCategory(null)
      setSearch('')
    }
  }

  if (!isVisible) return null

  let title = 'Choose your next block'
  let subtitle = `${descs.length} blocks in library`

  if (mode === 'trigger' && !selectedCategory && !search) {
    title = 'How should this flow start?'
    subtitle = 'Pick an entry point for your automation'
  } else if (isHandleMode) {
    const hm = HANDLE_MODE_TITLES[mode] || { title: 'Connect block', subtitle: '' }
    title = hm.title
    subtitle = hm.subtitle
  } else if (showPopular) {
    title = POPULAR_BRAND.label
    subtitle = POPULAR_BRAND.description
  } else if (selectedCategory) {
    const cat = getCategoryBrand(selectedCategory)
    const sub = AI_SUB_BRAND.find((s) => s.key === selectedCategory)
    if (sub) {
      title = sub.label
      subtitle = sub.description
    } else {
      title = cat.label
      subtitle = cat.description
    }
  }

  const showCategories = !selectedCategory && !search && !isHandleMode && !showPopular && !isAnalysisMode
  const showTriggerOptions = mode === 'trigger' && !selectedCategory && !search && !showPopular
  const showAiSubcategories = selectedCategory === 'ai' && !search && !showPopular

  const handleTriggerOptionClick = (opt) => {
    if (!opt.nodeName) return
    const desc = descs.find((n) => n.name === opt.nodeName)
    if (desc) handleSelect(desc)
  }

  const panelContent = (
    <>
      <div className="cq-panel-header">
        {(selectedCategory || isHandleMode || showPopular) && (
          <button type="button" className="cq-panel-back" onClick={isHandleMode ? onClose : handleBack} aria-label="Back">
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="cq-panel-header-text">
          <h3 className="cq-panel-title">{title}</h3>
          {subtitle && <p className="cq-panel-subtitle">{subtitle}</p>}
        </div>
        {!asSidebar && (
          <button type="button" className="cq-panel-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="cq-panel-search">
        <Search size={15} className="cq-panel-search-icon" />
        <input
          type="text"
          placeholder="Search blocks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="cq-panel-body">
        {showTriggerOptions ? (
          <ul className="cq-panel-list">
            {TRIGGER_OPTIONS_BRAND.map((opt) => {
              const available = !!opt.nodeName && descs.some((n) => n.name === opt.nodeName)
              return (
                <li key={opt.id}>
                  <CategoryCard
                    icon={opt.icon}
                    color={available ? '#6366f1' : '#94a3b8'}
                    title={opt.label}
                    description={opt.description}
                    disabled={!available}
                    showArrow={opt.showArrow}
                    onClick={() => handleTriggerOptionClick(opt)}
                  />
                </li>
              )
            })}
          </ul>
        ) : showCategories ? (
          <>
            <ul className="cq-panel-list cq-panel-list--compact">
              <li>
                <CategoryCard
                  icon={POPULAR_BRAND.icon}
                  color={POPULAR_BRAND.color}
                  title={POPULAR_BRAND.label}
                  description={POPULAR_BRAND.description}
                  onClick={() => setShowPopular(true)}
                />
              </li>
            </ul>

            {PANEL_SECTIONS.map((section) => {
              const visible = section.categories
                .map((key) => CATEGORY_BRAND[key])
                .filter((c) => c && (mode !== 'trigger' || c.key !== 'trigger'))
              if (!visible.length) return null
              return (
                <div key={section.id} className="cq-panel-section">
                  <div className="cq-panel-section-title">{section.title}</div>
                  <ul className="cq-panel-list">
                    {visible.map((cat) => (
                      <li key={cat.key}>
                        <CategoryCard
                          icon={cat.icon}
                          color={cat.color}
                          title={cat.label}
                          description={cat.description}
                          onClick={() => setSelectedCategory(cat.key)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </>
        ) : showAiSubcategories ? (
          <ul className="cq-panel-list">
            {AI_SUB_BRAND.map((sub) => (
              <li key={sub.key}>
                <CategoryCard
                  icon={sub.icon}
                  color={sub.color}
                  title={sub.label}
                  description={sub.description}
                  onClick={() => setSelectedCategory(sub.key)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="cq-panel-nodes">
            {(filteredNodes || []).length === 0 ? (
              <div className="cq-panel-empty">No blocks match your search</div>
            ) : (
              (filteredNodes || []).map((desc) => {
                const recommended = isHandleMode && ['ai_agent', 'llm_openai', 'llm_anthropic'].includes(desc.name)
                const brandColor = desc.color || '#6366f1'
                return (
                  <button
                    key={desc.name}
                    type="button"
                    className="cq-panel-node"
                    onClick={() => handleSelect(desc)}
                    style={{ '--card-accent': brandColor }}
                  >
                    <div className="cq-panel-node-icon cq-panel-card-icon--tinted" style={{ '--icon-tint': brandColor }}>
                      <NodeIcon name={desc.icon || 'zap'} size={18} color={brandColor} />
                    </div>
                    <div className="cq-panel-node-info">
                      <div className="cq-panel-node-name">
                        {desc.displayName || desc.name}
                        {recommended && <span className="cq-panel-pill">Suggested</span>}
                      </div>
                      <div className="cq-panel-node-desc">{desc.description || ''}</div>
                    </div>
                    <ChevronRight size={16} className="cq-panel-card-arrow" />
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </>
  )

  if (asSidebar) {
    return <div className="cq-panel">{panelContent}</div>
  }

  return (
    <div className="cq-panel-overlay" onClick={onClose}>
      <div className="cq-panel" onClick={(e) => e.stopPropagation()}>
        {panelContent}
      </div>
    </div>
  )
}
