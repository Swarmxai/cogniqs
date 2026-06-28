import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cpu, Trash2, Rocket, Download, KeyRound, Play, X, Award, Wand2, Copy, Globe } from 'lucide-react'
import { api } from '../api/client'

export default function Models() {
  const [models, setModels] = useState([])
  const [error, setError] = useState('')
  const [testModel, setTestModel] = useState(null)
  const [apiModel, setApiModel] = useState(null)

  const load = () => api.getModels().then(setModels).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const remove = async (id) => {
    if (!confirm('Delete this model?')) return
    await api.deleteModel(id); load()
  }

  const deploy = async (m) => {
    const updated = await api.deployModel(m.id)
    setApiModel(updated)
    load()
  }

  const rotate = async (id) => {
    const res = await api.rotateModelKey(id)
    alert(`New public API key:\n${res.api_key}`)
    load()
  }

  const publicUrl = (m) => `${window.location.origin}/api/trained-models/${m.id}/predict/public?api_key=${m.api_key}`

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Model Library</h1>
          <p className="text-muted">Deploy models with a public prediction API</p>
        </div>
        <Link to="/automl" className="cq-btn cq-btn-primary shrink-0">
          <Wand2 className="w-4 h-4" /> Train in Auto ML
        </Link>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl text-sm border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>{error}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m) => (
          <div key={m.id} className="cq-card cq-card-hover p-5">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #8b5cf6 14%, transparent)' }}>
                <Cpu className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'deployed' ? 'bg-emerald-500/15 text-emerald-500' : 'cq-surface-2 text-muted'}`}>{m.status}</span>
            </div>
            <h3 className="font-semibold mt-3 truncate">{m.name} <span className="text-xs text-faint">v{m.version}</span></h3>
            <p className="text-sm text-muted">{m.framework} · {m.problem_type || '—'}</p>
            {m.best_model && <p className="text-xs text-faint mt-1 flex items-center gap-1"><Award className="w-3 h-3" /> {m.best_model}</p>}
            <div className="flex flex-wrap gap-1.5 mt-4">
              <button onClick={() => setTestModel(m)} className="cq-btn cq-btn-primary !px-2.5 !py-1.5 !text-xs"><Play className="w-3 h-3" /> Test</button>
              {m.status !== 'deployed' ? (
                <button onClick={() => deploy(m)} className="cq-btn cq-btn-ghost !px-2.5 !py-1.5 !text-xs"><Rocket className="w-3 h-3" /> Deploy</button>
              ) : (
                <button onClick={() => setApiModel(m)} className="cq-btn cq-btn-ghost !px-2.5 !py-1.5 !text-xs"><Globe className="w-3 h-3" /> API</button>
              )}
              <a href={api.modelDownloadUrl(m.id)} className="cq-btn cq-btn-ghost !px-2.5 !py-1.5 !text-xs"><Download className="w-3 h-3" /> Download</a>
              <button onClick={() => rotate(m.id)} className="cq-btn cq-btn-ghost !px-2.5 !py-1.5 !text-xs"><KeyRound className="w-3 h-3" /> Key</button>
              <button onClick={() => remove(m.id)} className="cq-btn cq-btn-ghost !px-2.5 !py-1.5 !text-xs hover:!text-red-500"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
      {models.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="mb-4">No trained models yet.</p>
          <Link to="/automl" className="cq-btn cq-btn-primary inline-flex"><Wand2 className="w-4 h-4" /> Open Auto ML</Link>
        </div>
      )}

      {testModel && <PredictModal model={testModel} onClose={() => setTestModel(null)} />}

      {apiModel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setApiModel(null)}>
          <div className="cq-card max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Public prediction API · {apiModel.name}</h3>
            <p className="text-sm text-muted mb-3">POST JSON records from any HTTP client:</p>
            <code className="block text-xs p-3 rounded-xl cq-surface-2 break-all mb-3">{publicUrl(apiModel)}</code>
            <pre className="text-xs cq-surface-2 p-3 rounded-xl mb-3">{`curl -X POST '${publicUrl(apiModel)}' \\
  -H 'Content-Type: application/json' \\
  -d '{"records":[{"feature": 1.0}]}'`}</pre>
            <button type="button" className="cq-btn cq-btn-ghost text-sm" onClick={() => navigator.clipboard.writeText(publicUrl(apiModel))}>
              <Copy className="w-4 h-4" /> Copy URL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PredictModal({ model, onClose }) {
  const [schema, setSchema] = useState(null)
  const [json, setJson] = useState('[\n  {}\n]')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.modelSchema(model.id)
      .then((s) => {
        setSchema(s)
        const example = {}
        ;(s.features || []).forEach((f) => { example[f.name] = 0 })
        setJson(JSON.stringify([example], null, 2))
      })
      .catch(() => {})
  }, [model.id])

  const run = async () => {
    setBusy(true); setError(''); setResult(null)
    try {
      const records = JSON.parse(json)
      const res = await api.predict(model.id, Array.isArray(records) ? records : [records])
      setResult(res)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="cq-card max-w-2xl w-full max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Test Prediction · {model.name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)]"><X className="w-4 h-4" /></button>
        </div>
        {schema && (
          <p className="text-xs text-muted mb-3">Label: <b>{schema.label}</b> · Features: {(schema.features || []).map((f) => f.name).join(', ')}</p>
        )}
        <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={8} className="cq-input font-mono text-sm" />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button onClick={run} disabled={busy} className="cq-btn cq-btn-primary mt-3">
          <Play className="w-4 h-4" /> {busy ? 'Predicting…' : 'Predict'}
        </button>
        {result && (
          <div className="mt-4 p-4 rounded-xl cq-surface-2">
            <p className="text-sm font-medium mb-2">Predictions ({result.count})</p>
            <pre className="text-sm font-mono overflow-auto">{JSON.stringify(result.predictions, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
