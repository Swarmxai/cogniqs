import { useEffect, useState, useRef } from 'react'
import { Database, Upload, Trash2, Eye, Link2, X, Table } from 'lucide-react'
import { api } from '../api/client'

export default function Datasets() {
  const [datasets, setDatasets] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [importUrl, setImportUrl] = useState('')
  const fileRef = useRef(null)

  const load = () => api.getDatasets().then(setDatasets).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const upload = async (e) => {
    e.preventDefault()
    setError('')
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Choose a file'); return }
    setBusy(true)
    try {
      await api.uploadDataset(file, name || file.name)
      setShowUpload(false); setName(''); if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const doImport = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api.importDatasetUrl(importUrl, name || importUrl.split('/').pop())
      setShowUpload(false); setImportUrl(''); setName(''); load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this dataset?')) return
    await api.deleteDataset(id); load()
  }

  const openPreview = async (ds) => {
    try {
      const [rows, schema] = await Promise.all([api.previewDataset(ds.id), api.datasetSchema(ds.id)])
      setPreview({ ds, rows: rows.rows, columns: schema.columns })
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Datasets</h1>
          <p className="text-muted">Upload tabular data to train ML models with AutoML</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="cq-btn cq-btn-primary">
          <Upload className="w-4 h-4" /> Upload Dataset
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl text-sm border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>{error}</div>}

      {showUpload && (
        <div className="cq-card p-6 mb-6 space-y-4">
          <h3 className="font-semibold">New Dataset</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dataset name (optional)" className="cq-input" />
          <form onSubmit={upload} className="space-y-3">
            <input ref={fileRef} type="file" accept=".csv,.tsv,.parquet,.xlsx,.xls,.json,.jsonl"
              className="w-full text-sm file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-white file:cursor-pointer text-muted"
              style={{ }} />
            <button type="submit" disabled={busy} className="cq-btn cq-btn-primary">
              {busy ? 'Uploading…' : 'Upload File'}
            </button>
          </form>
          <div className="flex items-center gap-2 text-xs text-faint"><span className="flex-1 h-px bg-[var(--border)]" /> or import from URL <span className="flex-1 h-px bg-[var(--border)]" /></div>
          <form onSubmit={doImport} className="flex gap-2">
            <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://example.com/data.csv" className="cq-input flex-1" />
            <button type="submit" disabled={busy || !importUrl} className="cq-btn cq-btn-ghost"><Link2 className="w-4 h-4" /> Import</button>
          </form>
          <button onClick={() => setShowUpload(false)} className="text-sm text-muted hover:text-[var(--ink)]">Cancel</button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((d) => {
          const summary = d.dataset_metadata?.summary || {}
          return (
            <div key={d.id} className="cq-card cq-card-hover p-5">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #f59e0b 14%, transparent)' }}>
                  <Database className="w-4 h-4" style={{ color: '#f59e0b' }} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openPreview(d)} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)] hover:text-[var(--ink)]" title="Preview"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => remove(d.id)} className="p-1.5 rounded-lg text-faint hover:bg-red-500/10 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold mt-3 truncate">{d.name}</h3>
              <p className="text-sm text-muted truncate">{d.file_name}</p>
              <div className="flex gap-3 mt-3 text-xs text-faint">
                <span>{summary.row_count ?? '—'} rows</span>
                <span>{summary.column_count ?? '—'} cols</span>
                <span className={d.status === 'validated' ? 'text-emerald-500' : 'text-faint'}>{d.status}</span>
              </div>
              <p className="text-xs text-faint mt-2">ID {d.id} · use in a Dataset Config node</p>
            </div>
          )
        })}
      </div>
      {datasets.length === 0 && !showUpload && <p className="text-center py-12 text-muted">No datasets yet. Upload one to start training.</p>}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="cq-card max-w-5xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-token">
              <h3 className="font-semibold flex items-center gap-2"><Table className="w-4 h-4" /> {preview.ds.name}</h3>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)]"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-auto p-4">
              <table className="text-sm w-full">
                <thead><tr className="text-left border-b border-token">
                  {preview.columns.map((c) => (
                    <th key={c.name} className="px-3 py-2 font-medium whitespace-nowrap">{c.name}<span className="block text-xs text-faint font-normal">{c.dtype}</span></th>
                  ))}
                </tr></thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-b border-token">
                      {preview.columns.map((c) => <td key={c.name} className="px-3 py-1.5 whitespace-nowrap text-muted">{String(row[c.name] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
