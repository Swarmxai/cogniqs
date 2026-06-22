import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Workflow, Zap, ArrowRight, Plus, TrendingUp, Sparkles, Database, Cpu } from 'lucide-react'
import { api } from '../api/client'

const STAT_STYLES = {
  cyan: { color: '#06b6d4', glow: 'rgba(6,182,212,0.35)' },
  violet: { color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)' },
  amber: { color: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
  emerald: { color: '#10b981', glow: 'rgba(16,185,129,0.35)' },
}

export default function Dashboard() {
  const [workflows, setWorkflows] = useState([])
  const [executions, setExecutions] = useState([])
  const [nodeCount, setNodeCount] = useState(0)

  useEffect(() => {
    Promise.all([api.getWorkflows(), api.getExecutions(), api.getNodes()])
      .then(([w, e, n]) => {
        setWorkflows(w)
        setExecutions(e)
        setNodeCount(n.count)
      })
      .catch(console.error)
  }, [])

  const successRate = executions.length
    ? Math.round((executions.filter((e) => e.status === 'success').length / executions.length) * 100)
    : 100

  const stats = [
    { label: 'Workflows', value: workflows.length, icon: Workflow, tone: 'cyan' },
    { label: 'Executions', value: executions.length, icon: Zap, tone: 'amber' },
    { label: 'Node Types', value: nodeCount, icon: Bot, tone: 'violet' },
    { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, tone: 'emerald' },
  ]

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      {/* Hero — clean command panel (distinct from the gradient login) */}
      <div className="relative overflow-hidden cq-card mb-8 p-7 lg:p-9">
        <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundImage: 'var(--grad-brand)' }} />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7 pl-2">
          <div className="min-w-0">
            <span className="cq-chip mb-4"><Sparkles className="w-3 h-3" /> GenAI Low-Code Studio</span>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">
              Welcome back to <span className="gradient-text">Cogniqs</span>
            </h1>
            <p className="text-muted max-w-xl mb-6">
              Design, automate, and ship AI agents, RAG pipelines, and AutoML models — all from one visual canvas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/workflows" className="cq-btn cq-btn-primary">
                <Plus className="w-4 h-4" /> New Workflow
              </Link>
              <Link to="/templates" className="cq-btn cq-btn-ghost">
                Browse Templates <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Live status tiles */}
          <div className="shrink-0 grid grid-cols-2 gap-3 lg:w-72">
            {[
              { label: 'Workflows', value: workflows.length, tone: 'cyan' },
              { label: 'Node Types', value: nodeCount, tone: 'violet' },
              { label: 'Executions', value: executions.length, tone: 'amber' },
              { label: 'Success', value: `${successRate}%`, tone: 'emerald' },
            ].map(({ label, value, tone }) => {
              const s = STAT_STYLES[tone]
              return (
                <div key={label} className="cq-surface-2 rounded-xl px-4 py-3 border border-token">
                  <div className="flex items-center gap-1.5 text-xs text-faint mb-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.glow}` }} />
                    {label}
                  </div>
                  <p className="text-xl font-bold tracking-tight">{value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, tone }) => {
          const s = STAT_STYLES[tone]
          return (
            <div key={label} className="cq-card cq-card-hover p-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-20 h-20 rounded-full blur-2xl opacity-30"
                style={{ background: s.color }} />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `color-mix(in srgb, ${s.color} 14%, transparent)`, boxShadow: `0 0 0 1px color-mix(in srgb, ${s.color} 30%, transparent)` }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                <p className="text-sm text-muted mt-0.5">{label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent workflows */}
        <div className="lg:col-span-2 cq-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent Workflows</h2>
            <Link to="/workflows" className="text-sm flex items-center gap-1 hover:underline" style={{ color: 'var(--primary)' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {workflows.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border border-dashed border-token">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center cq-surface-2">
                <Workflow className="w-6 h-6 text-faint" />
              </div>
              <p className="text-muted mb-4">No workflows yet — let's build your first one.</p>
              <Link to="/workflows" className="cq-btn cq-btn-primary inline-flex">
                <Plus className="w-4 h-4" /> Create workflow
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {workflows.slice(0, 6).map((w) => (
                <Link
                  key={w.id}
                  to={`/workflows/${w.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--surface-2)] border border-transparent hover:border-[var(--border)] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center cq-surface-2 shrink-0">
                      <Workflow className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{w.name}</p>
                      <p className="text-xs text-faint">{w.nodes?.length || 0} nodes</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-faint shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick start — surface card with neon step badges */}
        <div className="cq-card p-6">
          <h2 className="font-semibold text-lg mb-1.5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-soft)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            </span>
            Quick Start
          </h2>
          <p className="text-muted text-sm mb-5">
            Build an AI agent workflow in minutes with the visual editor.
          </p>
          <ol className="space-y-3 text-sm mb-6">
            {[
              'Add a Chat or Manual trigger',
              'Connect an OpenAI / Anthropic model',
              'Wire an AI Agent or RAG chain',
              'Execute and test via chat',
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link to="/workflows" className="cq-btn cq-btn-primary w-full">
            <Plus className="w-4 h-4" /> New Workflow
          </Link>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          { to: '/datasets', label: 'Upload a dataset', desc: 'Bring CSV, Parquet & more', icon: Database, tone: 'cyan' },
          { to: '/models', label: 'Train a model', desc: 'No-code AutoML', icon: Cpu, tone: 'violet' },
          { to: '/agents', label: 'Create an agent', desc: 'Tools + memory', icon: Bot, tone: 'emerald' },
        ].map(({ to, label, desc, icon: Icon, tone }) => {
          const s = STAT_STYLES[tone]
          return (
            <Link key={to} to={to} className="cq-card cq-card-hover p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${s.color} 14%, transparent)` }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </span>
              <div className="min-w-0">
                <p className="font-medium truncate">{label}</p>
                <p className="text-xs text-faint truncate">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-faint ml-auto shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
