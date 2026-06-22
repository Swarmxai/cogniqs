import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Rocket, Trash2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import { api } from '../api/client'
import { WIDGETS, newWidget, WidgetView } from '../components/uibuilder/widgets'

export default function UIBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [components, setComponents] = useState([])
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    api.getUIProject(id).then((p) => { setProject(p); setComponents(p.components || []) }).catch(console.error)
  }, [id])

  const addWidget = (type) => {
    const w = newWidget(type)
    setComponents((c) => [...c, w])
    setSelected(w.id)
  }

  const updateProp = (wid, name, value) => {
    setComponents((c) => c.map((w) => w.id === wid ? { ...w, props: { ...w.props, [name]: value } } : w))
  }

  const move = (idx, dir) => {
    setComponents((c) => {
      const next = [...c]
      const target = idx + dir
      if (target < 0 || target >= next.length) return c
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  const removeWidget = (wid) => {
    setComponents((c) => c.filter((w) => w.id !== wid))
    if (selected === wid) setSelected(null)
  }

  const save = async () => {
    await api.updateUIProject(id, { components })
    setStatus('Saved'); setTimeout(() => setStatus(''), 1500)
  }

  const publish = async () => {
    await api.updateUIProject(id, { components })
    const res = await api.publishUIProject(id)
    setProject((p) => ({ ...p, published: true, public_id: res.public_id }))
    setStatus('Published'); setTimeout(() => setStatus(''), 2000)
  }

  const sel = components.find((w) => w.id === selected)
  const schema = sel ? WIDGETS[sel.type].props : []

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--color-surface)]">
      <header className="h-14 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 bg-[var(--color-surface-elevated)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ui-development')} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"><ArrowLeft className="w-4 h-4" /></button>
          <span className="font-semibold">{project?.name || 'Loading…'}</span>
          {status && <span className="text-xs text-emerald-600">{status}</span>}
        </div>
        <div className="flex items-center gap-2">
          {project?.published && (
            <a href={`/p/${project.public_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-sm">
              <ExternalLink className="w-4 h-4" /> View
            </a>
          )}
          <button onClick={save} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-sm"><Save className="w-4 h-4" /> Save</button>
          <button onClick={publish} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm"><Rocket className="w-4 h-4" /> Publish</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Palette */}
        <div className="w-48 border-r border-stone-200 dark:border-stone-800 p-3 overflow-y-auto bg-[var(--color-surface-elevated)]">
          <p className="text-xs font-medium text-stone-500 mb-2">Widgets</p>
          <div className="space-y-1.5">
            {Object.entries(WIDGETS).map(([type, def]) => {
              const Icon = def.icon
              return (
                <button key={type} onClick={() => addWidget(type)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-stone-200 dark:border-stone-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                  <Icon className="w-4 h-4 text-indigo-500" /> {def.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-8 bg-stone-100 dark:bg-stone-900">
          <div className="max-w-2xl mx-auto bg-white dark:bg-stone-950 rounded-2xl shadow-sm min-h-[60vh] p-8 space-y-4">
            {components.length === 0 && <p className="text-center text-stone-400 py-20">Click a widget on the left to add it here</p>}
            {components.map((w, idx) => (
              <div key={w.id} onClick={() => setSelected(w.id)}
                className={`relative group rounded-lg p-2 cursor-pointer ${selected === w.id ? 'ring-2 ring-indigo-400' : 'hover:ring-1 hover:ring-stone-300'}`}>
                <WidgetView widget={w} />
                <div className="absolute -top-3 -right-2 opacity-0 group-hover:opacity-100 flex gap-0.5 bg-white dark:bg-stone-800 rounded-lg shadow border border-stone-200 dark:border-stone-700">
                  <button onClick={(e) => { e.stopPropagation(); move(idx, -1) }} className="p-1 hover:text-indigo-600"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); move(idx, 1) }} className="p-1 hover:text-indigo-600"><ChevronDown className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); removeWidget(w.id) }} className="p-1 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties */}
        <div className="w-72 border-l border-stone-200 dark:border-stone-800 p-4 overflow-y-auto bg-[var(--color-surface-elevated)]">
          <p className="text-xs font-medium text-stone-500 mb-3">Properties</p>
          {!sel && <p className="text-sm text-stone-400">Select a widget to edit</p>}
          {sel && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{WIDGETS[sel.type].label}</p>
              {schema.map((prop) => (
                <div key={prop.name}>
                  <label className="text-xs text-stone-500 mb-1 block">{prop.label}</label>
                  {prop.type === 'textarea' ? (
                    <textarea value={sel.props[prop.name] ?? ''} onChange={(e) => updateProp(sel.id, prop.name, e.target.value)} rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent" />
                  ) : prop.type === 'select' ? (
                    <select value={sel.props[prop.name]} onChange={(e) => updateProp(sel.id, prop.name, e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent">
                      {prop.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : prop.type === 'color' ? (
                    <input type="color" value={sel.props[prop.name]} onChange={(e) => updateProp(sel.id, prop.name, e.target.value)} className="w-full h-9 rounded-lg" />
                  ) : (
                    <input type={prop.type === 'number' ? 'number' : 'text'} value={sel.props[prop.name] ?? ''}
                      onChange={(e) => updateProp(sel.id, prop.name, prop.type === 'number' ? Number(e.target.value) : e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
