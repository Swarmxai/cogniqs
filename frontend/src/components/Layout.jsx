import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Workflow, History, Moon, Sun, LogOut, Sparkles,
  LayoutTemplate, Key, Database, Cpu, FolderKanban, Bot, Boxes,
  TrendingUp, Layout as LayoutIcon, Menu, Table2, Wand2, Settings as SettingsIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { useTheme } from '../context/ThemeContext'

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Build',
    items: [
      { to: '/workflows', label: 'Workflows', icon: Workflow },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/agents', label: 'Agents', icon: Bot },
      { to: '/ui-development', label: 'UI Builder', icon: LayoutIcon },
    ],
  },
  {
    label: 'Data & Models',
    items: [
      { to: '/datasets', label: 'Datasets', icon: Table2 },
      { to: '/automl', label: 'Auto ML', icon: Wand2 },
      { to: '/databases', label: 'Databases', icon: Database },
      { to: '/models', label: 'Model Library', icon: Cpu },
      { to: '/vectors', label: 'Knowledge Studio', icon: Boxes },
    ],
  },
  {
    label: 'Operate',
    items: [
      { to: '/executions', label: 'Executions', icon: History },
      { to: '/usage', label: 'Usage', icon: TrendingUp },
      { to: '/templates', label: 'Templates', icon: LayoutTemplate },
      { to: '/credentials', label: 'Credentials', icon: Key },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

function NavItem({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'text-[var(--ink)] bg-[var(--surface-2)] border border-[var(--border)]'
            : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] border border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full transition-all ${
              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
            }`}
            style={{ background: 'var(--grad-brand)', boxShadow: isActive ? '0 0 10px var(--glow)' : 'none' }}
          />
          <Icon className={`w-[18px] h-[18px] ${isActive ? '' : 'opacity-80'}`}
            style={isActive ? { color: 'var(--primary-strong)' } : undefined} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebar = (onClick) => (
    <>
      <div className="px-3 h-16 flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center neon-ring"
          style={{ backgroundImage: 'var(--grad-brand)' }}>
          <Sparkles className="w-[18px] h-[18px] text-white" />
        </span>
        <div className="leading-tight">
          <div className="font-bold text-[17px] gradient-text">Cogniqs</div>
          <div className="text-[10px] tracking-wide uppercase text-faint">GenAI Studio</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} onClick={onClick} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-token">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl cq-surface-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundImage: 'var(--grad-brand)' }}>
            {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-faint truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-[var(--ink-faint)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[256px] shrink-0 h-screen sticky top-0 border-r border-token"
        style={{ background: 'var(--bg-soft)' }}>
        {sidebar()}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col border-r border-token animate-fade-up"
            style={{ background: 'var(--bg-soft)' }}>
            {sidebar(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-4 px-4 lg:px-6 border-b border-token backdrop-blur-md"
          style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg cq-btn-ghost"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2 font-bold gradient-text">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} /> Cogniqs
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={toggle}
              className="cq-btn cq-btn-ghost !px-2.5 !py-2"
              aria-label="Toggle theme"
              title={dark ? 'Switch to light' : 'Switch to dark'}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
