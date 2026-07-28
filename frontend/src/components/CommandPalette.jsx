import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Workflow, History, LayoutTemplate, Key, Database, Cpu,
  FolderKanban, Bot, Boxes, TrendingUp, Layout as LayoutIcon, Table2, Wand2,
  Settings as SettingsIcon, Search, Moon, Sun, LogOut, Plus, CornerDownLeft,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NAV_COMMANDS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/', keywords: 'home overview' },
  { id: 'workflows', label: 'Workflows', icon: Workflow, to: '/workflows', keywords: 'automation canvas flows' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, to: '/projects', keywords: 'folders organize' },
  { id: 'agents', label: 'Agents', icon: Bot, to: '/agents', keywords: 'ai chat assistant' },
  { id: 'ui-builder', label: 'UI Builder', icon: LayoutIcon, to: '/ui-development', keywords: 'apps forms pages' },
  { id: 'datasets', label: 'Datasets', icon: Table2, to: '/datasets', keywords: 'data csv upload' },
  { id: 'automl', label: 'Auto ML', icon: Wand2, to: '/automl', keywords: 'train machine learning' },
  { id: 'databases', label: 'Databases', icon: Database, to: '/databases', keywords: 'sql postgres connections' },
  { id: 'models', label: 'Model Library', icon: Cpu, to: '/models', keywords: 'trained ml' },
  { id: 'knowledge', label: 'Knowledge Studio', icon: Boxes, to: '/vectors', keywords: 'rag vectors embeddings documents' },
  { id: 'executions', label: 'Executions', icon: History, to: '/executions', keywords: 'runs history logs' },
  { id: 'usage', label: 'Usage', icon: TrendingUp, to: '/usage', keywords: 'analytics cost tokens' },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, to: '/templates', keywords: 'starter examples' },
  { id: 'credentials', label: 'Credentials', icon: Key, to: '/credentials', keywords: 'api keys vault secrets' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, to: '/settings', keywords: 'account mfa security' },
]

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { dark, toggle } = useTheme()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const commands = useMemo(() => [
    { id: 'new-workflow', label: 'Create new workflow', icon: Plus, group: 'Actions', run: () => navigate('/workflows') },
    {
      id: 'toggle-theme',
      label: dark ? 'Switch to light theme' : 'Switch to dark theme',
      icon: dark ? Sun : Moon,
      group: 'Actions',
      keywords: 'dark light mode appearance',
      run: toggle,
    },
    { id: 'logout', label: 'Log out', icon: LogOut, group: 'Actions', keywords: 'sign out exit', run: logout },
    ...NAV_COMMANDS.map((c) => ({ ...c, group: 'Go to', run: () => navigate(c.to) })),
  ], [navigate, dark, toggle, logout])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) =>
      c.label.toLowerCase().includes(q) || (c.keywords || '').toLowerCase().includes(q)
    )
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => { setActiveIdx(0) }, [query])

  const runCommand = useCallback((cmd) => {
    onClose()
    cmd.run()
  }, [onClose])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      e.preventDefault()
      runCommand(filtered[activeIdx])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  if (!open) return null

  let lastGroup = null

  return (
    <div className="cq-cmdk-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="cq-cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cq-cmdk-input-row">
          <Search className="w-4 h-4 text-faint shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages and actions…"
            aria-label="Search commands"
          />
          <kbd className="cq-cmdk-kbd">esc</kbd>
        </div>

        <div className="cq-cmdk-list" ref={listRef}>
          {filtered.length === 0 && (
            <p className="cq-cmdk-empty">No results for “{query}”</p>
          )}
          {filtered.map((cmd, i) => {
            const showGroup = cmd.group !== lastGroup
            lastGroup = cmd.group
            const Icon = cmd.icon
            return (
              <div key={cmd.id}>
                {showGroup && <p className="cq-cmdk-group">{cmd.group}</p>}
                <button
                  type="button"
                  data-active={i === activeIdx}
                  className="cq-cmdk-item"
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => runCommand(cmd)}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{cmd.label}</span>
                  {i === activeIdx && <CornerDownLeft className="w-3.5 h-3.5 opacity-50" />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="cq-cmdk-footer">
          <span><kbd className="cq-cmdk-kbd">↑↓</kbd> navigate</span>
          <span><kbd className="cq-cmdk-kbd">↵</kbd> select</span>
          <span><kbd className="cq-cmdk-kbd">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
