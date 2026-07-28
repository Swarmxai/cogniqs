import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Search, Link, Globe, Sparkles, ArrowRight } from 'lucide-react'
import { api } from '../api/client'

const ICONS = { bot: Bot, search: Search, link: Link, globe: Globe, sparkles: Sparkles }

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.getTemplates().then(setTemplates).catch(console.error)
  }, [])

  const applyTemplate = async (id) => {
    setLoading(id)
    try {
      const wf = await api.useTemplate(id)
      navigate(`/workflows/${wf.id}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(null)
    }
  }

  const categories = [...new Set(templates.map((t) => t.category))]
  const filtered = templates.filter((t) =>
    !filter || t.category === filter || t.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <h1 className="text-3xl font-bold tracking-tight mb-1">Template Marketplace</h1>
      <p className="text-muted mb-7">Start from pre-built GenAI workflow templates</p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!filter ? 'text-white' : 'cq-surface-2 text-muted hover:text-[var(--ink)]'}`}
          style={!filter ? { backgroundImage: 'var(--grad-brand)' } : undefined}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filter === cat ? 'text-white' : 'cq-surface-2 text-muted hover:text-[var(--ink)]'}`}
            style={filter === cat ? { backgroundImage: 'var(--grad-brand)' } : undefined}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tpl) => {
          const Icon = ICONS[tpl.icon] || Sparkles
          return (
            <div key={tpl.id} className="cq-card cq-card-hover p-5">
              {tpl.featured && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Featured
                </span>
              )}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center my-3" style={{ background: 'var(--primary-soft)' }}>
                <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-semibold mb-1">{tpl.name}</h3>
              <p className="text-sm text-muted mb-3 line-clamp-2">{tpl.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-faint">{tpl.nodes?.length || 0} nodes · {tpl.category}</span>
                <button
                  onClick={() => applyTemplate(tpl.id)}
                  disabled={loading === tpl.id}
                  className="flex items-center gap-1 text-sm font-medium hover:underline disabled:opacity-50"
                  style={{ color: 'var(--primary)' }}
                >
                  {loading === tpl.id ? 'Creating…' : 'Use template'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
