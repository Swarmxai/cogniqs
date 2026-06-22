import { useEffect, useState } from 'react'
import { Boxes, Trash2, Eye, X } from 'lucide-react'
import { api } from '../api/client'

export default function Vectors() {
  const [collections, setCollections] = useState([])
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  const load = () => api.getCollections().then(setCollections).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const view = async (name) => {
    try { setDetail(await api.getCollection(name)) } catch (e) { setError(e.message) }
  }

  const remove = async (name) => {
    if (!confirm(`Delete collection "${name}"?`)) return
    await api.deleteCollection(name); load()
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <h1 className="text-3xl font-bold tracking-tight mb-1">Vector Stores</h1>
      <p className="text-muted mb-7">ChromaDB collections used by your RAG pipelines</p>

      {error && <div className="mb-4 p-3 rounded-xl text-sm border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>{error}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((c) => (
          <div key={c.name} className="cq-card cq-card-hover p-5">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #14b8a6 14%, transparent)' }}><Boxes className="w-4 h-4" style={{ color: '#14b8a6' }} /></div>
              <div className="flex gap-1">
                <button onClick={() => view(c.name)} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"><Eye className="w-4 h-4" /></button>
                <button onClick={() => remove(c.name)} className="p-1.5 rounded-lg text-faint hover:bg-red-500/10 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="font-semibold mt-3 truncate">{c.name}</h3>
            <p className="text-sm text-muted">{c.count} documents</p>
          </div>
        ))}
      </div>
      {collections.length === 0 && <p className="text-center py-12 text-muted">No vector collections. Run a Document Ingest node to create one.</p>}

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="cq-card max-w-2xl w-full max-h-[80vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{detail.name} · {detail.count} docs</h3>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)]"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {(detail.documents || []).map((doc, i) => (
                <div key={i} className="p-3 rounded-xl cq-surface-2 text-sm">{String(doc).slice(0, 300)}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
