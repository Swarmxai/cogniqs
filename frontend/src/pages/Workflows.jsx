import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Play, Workflow as WorkflowIcon, Sparkles } from 'lucide-react'
import { api } from '../api/client'
import WorkflowBuilder from '../components/WorkflowBuilder'

export default function Workflows() {
  const [workflows, setWorkflows] = useState([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const navigate = useNavigate()

  const load = () => api.getWorkflows().then(setWorkflows).catch(console.error)
  useEffect(() => { load() }, [])

  const create = async () => {
    setCreating(true)
    try {
      const wf = await api.createWorkflow({
        name: `Workflow ${workflows.length + 1}`,
        description: 'New GenAI workflow',
        nodes: [],
        connections: [],
      })
      navigate(`/workflows/${wf.id}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const remove = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this workflow?')) return
    await api.deleteWorkflow(id)
    load()
  }

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Workflows</h1>
          <p className="text-muted">{workflows.length} automation flows</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBuilder(true)} className="cq-btn cq-btn-ghost">
            <Sparkles className="w-4 h-4" /> AI Builder
          </button>
          <button onClick={create} disabled={creating} className="cq-btn cq-btn-primary">
            <Plus className="w-4 h-4" />
            {creating ? 'Creating…' : 'New Workflow'}
          </button>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
        <input
          type="search"
          placeholder="Search workflows…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="cq-input pl-10"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w) => (
          <Link key={w.id} to={`/workflows/${w.id}`} className="group cq-card cq-card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--primary-soft)' }}>
                <Play className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              </div>
              <button
                onClick={(e) => remove(w.id, e)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-faint hover:bg-red-500/10 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-semibold mb-1">{w.name}</h3>
            <p className="text-sm text-muted line-clamp-2 mb-3">{w.description || 'No description'}</p>
            <div className="flex items-center gap-2 text-xs text-faint">
              <span>{w.nodes?.length || 0} nodes</span>
              <span>·</span>
              <span className={w.active ? 'text-emerald-500' : ''}>{w.active ? 'Active' : 'Draft'}</span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center cq-surface-2">
            <WorkflowIcon className="w-6 h-6 text-faint" />
          </div>
          <p className="text-muted">No workflows found</p>
        </div>
      )}
      {showBuilder && <WorkflowBuilder onClose={() => setShowBuilder(false)} />}
    </div>
  )
}
