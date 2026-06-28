import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Plus, Trash2, Pencil, Workflow, ArrowRight } from 'lucide-react'
import { api } from '../api/client'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')

  const load = () => {
    Promise.all([api.getProjects(), api.getWorkflows()])
      .then(([p, w]) => { setProjects(p); setWorkflows(w) })
      .catch(console.error)
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setName(''); setDescription(''); setColor('#6366f1'); setShowForm(true) }
  const openEdit = (p) => { setEditing(p); setName(p.name); setDescription(p.description); setColor(p.color); setShowForm(true) }

  const save = async (e) => {
    e.preventDefault()
    const data = { name, description, color }
    if (editing) await api.updateProject(editing.id, data)
    else await api.createProject(data)
    setShowForm(false); load()
  }

  const remove = async (id) => { if (confirm('Delete this project?')) { await api.deleteProject(id); load() } }

  const projectWorkflows = (pid) => workflows.filter((w) => w.project_id === pid)

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Projects</h1>
          <p className="text-muted">Group workflows by product, team, or use case</p>
        </div>
        <button onClick={openNew} className="cq-btn cq-btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="cq-card p-6 mb-6 space-y-4">
          <h3 className="font-semibold">{editing ? 'Edit' : 'New'} Project</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" required className="cq-input" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="cq-input" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border border-token cursor-pointer" />
            <span className="text-sm text-muted">Project color</span>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="cq-btn cq-btn-primary">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="cq-btn cq-btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => {
          const pWf = projectWorkflows(p.id)
          const isOpen = expanded === p.id
          return (
            <div key={p.id} className="cq-card cq-card-hover p-5">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${p.color}22` }}>
                  <FolderKanban className="w-4 h-4" style={{ color: p.color }} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg text-faint hover:bg-red-500/10 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold mt-3">{p.name}</h3>
              <p className="text-sm text-muted line-clamp-2">{p.description || 'No description'}</p>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : p.id)}
                className="text-xs text-faint mt-2 flex items-center gap-1 hover:text-[var(--ink)]"
              >
                {pWf.length} workflows <ArrowRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>
              {isOpen && pWf.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-token pt-3">
                  {pWf.map((w) => (
                    <li key={w.id}>
                      <Link to={`/workflows/${w.id}`} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-[var(--surface-2)]">
                        <Workflow className="w-3.5 h-3.5 shrink-0" style={{ color: p.color }} />
                        <span className="truncate">{w.name}</span>
                        {w.active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 ml-auto">Live</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {isOpen && pWf.length === 0 && (
                <p className="text-xs text-muted mt-3 border-t border-token pt-3">
                  Assign workflows from the editor&apos;s project dropdown
                </p>
              )}
            </div>
          )
        })}
      </div>
      {projects.length === 0 && !showForm && <p className="text-center py-12 text-muted">No projects yet</p>}
    </div>
  )
}
