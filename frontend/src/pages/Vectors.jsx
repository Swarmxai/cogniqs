import { useEffect, useState } from 'react'
import { Boxes, Trash2, Eye, X, Plus, Search, Upload, Sparkles } from 'lucide-react'
import { api } from '../api/client'

export default function Vectors() {
  const [collections, setCollections] = useState([])
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [ingestText, setIngestText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [activeCollection, setActiveCollection] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => api.getCollections().then(setCollections).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const view = async (name) => {
    try { setDetail(await api.getCollection(name)) } catch (e) { setError(e.message) }
  }

  const remove = async (name) => {
    if (!confirm(`Delete collection "${name}"?`)) return
    await api.deleteCollection(name)
    if (activeCollection === name) setActiveCollection(null)
    load()
  }

  const create = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setBusy(true)
    try {
      await api.createCollection(newName.trim())
      setNewName('')
      load()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const ingest = async () => {
    if (!activeCollection || !ingestText.trim()) return
    setBusy(true)
    setError('')
    try {
      const r = await api.ingestDocuments(activeCollection, [ingestText])
      setIngestText('')
      setSearchResults(null)
      load()
      alert(`Ingested ${r.ingested} chunks (${r.total} total)`)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const search = async () => {
    if (!activeCollection || !searchQuery.trim()) return
    setBusy(true)
    try {
      setSearchResults(await api.searchCollection(activeCollection, searchQuery))
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
        <div>
          <span className="cq-chip mb-3"><Sparkles className="w-3 h-3" /> Cogniqs differentiator</span>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Knowledge Studio</h1>
          <p className="text-muted">Upload docs, search semantically, and wire collections into RAG workflows — no other step required</p>
        </div>
        <form onSubmit={create} className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New collection name" data-testid="ks-collection-name" className="cq-input !w-48" />
          <button type="submit" disabled={busy} data-testid="ks-create-collection" className="cq-btn cq-btn-primary"><Plus className="w-4 h-4" /> Create</button>
        </form>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl text-sm border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>{error}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Collections */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Collections</h2>
          {collections.map((c) => (
            <div key={c.name}
              data-testid={`ks-collection-${c.name}`}
              className={`cq-card p-4 cursor-pointer transition-all ${activeCollection === c.name ? 'ring-2 ring-[var(--primary)]' : 'cq-card-hover'}`}
              onClick={() => { setActiveCollection(c.name); setSearchResults(null) }}>
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #14b8a6 14%, transparent)' }}>
                  <Boxes className="w-4 h-4" style={{ color: '#14b8a6' }} />
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); view(c.name) }} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)]"><Eye className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); remove(c.name) }} className="p-1.5 rounded-lg text-faint hover:bg-red-500/10 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold mt-2 truncate">{c.name}</h3>
              <p className="text-sm text-muted">{c.count} chunks</p>
            </div>
          ))}
          {collections.length === 0 && <p className="text-sm text-muted py-6 text-center">Create a collection to get started</p>}
        </div>

        {/* Ingest + Search */}
        <div className="lg:col-span-2 space-y-4">
          {!activeCollection ? (
            <div className="cq-card p-12 text-center text-muted">
              <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Select a collection to ingest documents or run semantic search
            </div>
          ) : (
            <>
              <div className="cq-card p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  Ingest into <span className="gradient-text">{activeCollection}</span>
                </h3>
                <textarea value={ingestText} onChange={(e) => setIngestText(e.target.value)}
                  data-testid="ks-ingest-text"
                  placeholder="Paste text, notes, or documentation… auto-chunked for RAG" rows={6} className="cq-input mb-3" />
                <div className="flex flex-wrap gap-2 mb-3">
                  <label className="cq-btn cq-btn-ghost cursor-pointer text-sm">
                    <Upload className="w-4 h-4" /> Upload PDF / text
                    <input type="file" accept=".pdf,.txt,.md,.csv,.json" className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f || !activeCollection) return
                        setBusy(true)
                        try {
                          const r = await api.ingestFile(activeCollection, f)
                          load()
                          alert(`Ingested ${r.ingested} chunks from ${f.name}`)
                        } catch (err) { setError(err.message) }
                        finally { setBusy(false); e.target.value = '' }
                      }} />
                  </label>
                </div>
                <button onClick={ingest} disabled={busy || !ingestText.trim()} data-testid="ks-ingest-btn" className="cq-btn cq-btn-primary">
                  <Upload className="w-4 h-4" /> Ingest documents
                </button>
              </div>

              <div className="cq-card p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  Semantic search
                </h3>
                <div className="flex gap-2 mb-4">
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="ks-search-input"
                    onKeyDown={(e) => e.key === 'Enter' && search()}
                    placeholder="Ask a question or search by meaning…" className="cq-input flex-1" />
                  <button onClick={search} disabled={busy || !searchQuery.trim()} data-testid="ks-search-btn" className="cq-btn cq-btn-primary">
                    <Search className="w-4 h-4" /> Search
                  </button>
                </div>
                {searchResults?.results?.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.results.map((hit, i) => (
                      <div key={i} className="p-3 rounded-xl cq-surface-2 text-sm">
                        <div className="flex justify-between text-xs text-faint mb-1">
                          <span>Match {i + 1}</span>
                          <span>Score {hit.score}</span>
                        </div>
                        {String(hit.content).slice(0, 400)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

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
