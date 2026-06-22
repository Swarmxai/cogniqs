import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout as LayoutIcon, Plus, Trash2, ExternalLink, Pencil } from 'lucide-react'
import { api } from '../api/client'

export default function UIDevelopment() {
  const [projects, setProjects] = useState([])
  const [name, setName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const load = () => api.getUIProjects().then(setProjects).catch(console.error)
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    const p = await api.createUIProject(name)
    setShowForm(false); setName('')
    navigate(`/ui-development/${p.id}`)
  }

  const remove = async (id) => { if (confirm('Delete this app?')) { await api.deleteUIProject(id); load() } }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">UI Builder</h1>
          <p className="text-muted">Build and publish no-code apps & landing pages</p>
        </div>
        <button onClick={() => setShowForm(true)} className="cq-btn cq-btn-primary">
          <Plus className="w-4 h-4" /> New App
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="cq-card p-6 mb-6 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="App name" required autoFocus className="cq-input flex-1" />
          <button type="submit" className="cq-btn cq-btn-primary">Create & Edit</button>
          <button type="button" onClick={() => setShowForm(false)} className="cq-btn cq-btn-ghost">Cancel</button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="cq-card cq-card-hover p-5">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-soft)' }}><LayoutIcon className="w-4 h-4" style={{ color: 'var(--primary)' }} /></div>
              <div className="flex gap-1">
                <button onClick={() => navigate(`/ui-development/${p.id}`)} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg text-faint hover:bg-red-500/10 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="font-semibold mt-3 truncate">{p.name}</h3>
            <p className="text-sm text-muted">{p.components.length} components</p>
            {p.published && (
              <a href={`/p/${p.public_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-500 mt-2">
                <ExternalLink className="w-3 h-3" /> Live at /p/{p.public_id}
              </a>
            )}
          </div>
        ))}
      </div>
      {projects.length === 0 && !showForm && <p className="text-center py-12 text-muted">No apps yet. Create one to start building.</p>}
    </div>
  )
}
