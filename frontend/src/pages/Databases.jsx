import { useEffect, useState } from 'react'
import { Database, Plus, Trash2, Plug, Server, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../api/client'

const DB_TYPES = [
  { value: 'postgresql', label: 'PostgreSQL', color: '#336791', defaultPort: 5432 },
  { value: 'mysql', label: 'MySQL', color: '#00758f', defaultPort: 3306 },
  { value: 'sqlite', label: 'SQLite', color: '#003b57', defaultPort: null },
  { value: 'mssql', label: 'SQL Server', color: '#cc2927', defaultPort: 1433 },
]

const typeMeta = (type) => DB_TYPES.find((t) => t.value === type) || DB_TYPES[0]

export default function Databases() {
  const [databases, setDatabases] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [testing, setTesting] = useState(null)
  const [testResult, setTestResult] = useState({})
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    user: '',
    password: '',
    connection_url: '',
  })

  const load = () => api.getDatabases().then(setDatabases).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const onTypeChange = (type) => {
    const meta = typeMeta(type)
    setForm((f) => ({
      ...f,
      type,
      port: meta.defaultPort ?? '',
      host: type === 'sqlite' ? '' : f.host || 'localhost',
    }))
  }

  const create = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.createDatabase({
        ...form,
        port: form.port === '' ? null : Number(form.port),
      })
      setShowForm(false)
      setForm({
        name: '', type: 'postgresql', host: 'localhost', port: 5432,
        database: '', user: '', password: '', connection_url: '',
      })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (id) => {
    if (!confirm('Remove this database connection?')) return
    await api.deleteDatabase(id)
    load()
  }

  const test = async (id) => {
    setTesting(id)
    setTestResult((r) => ({ ...r, [id]: null }))
    try {
      const res = await api.testDatabase(id)
      setTestResult((r) => ({ ...r, [id]: res }))
    } catch (err) {
      setTestResult((r) => ({ ...r, [id]: { ok: false, message: err.message } }))
    } finally {
      setTesting(null)
    }
  }

  const isSqlite = form.type === 'sqlite'

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Databases</h1>
          <p className="text-muted">Manage database connections for workflows and queries</p>
        </div>
        <button onClick={() => setShowForm(true)} className="cq-btn cq-btn-primary">
          <Plus className="w-4 h-4" /> Connect Database
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm border"
          style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={create} className="cq-card p-6 mb-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Plug className="w-4 h-4" /> New connection</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Connection name" required className="cq-input" />
            <select value={form.type} onChange={(e) => onTypeChange(e.target.value)} className="cq-input">
              {DB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {!isSqlite ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="Host" required className="cq-input" />
              <input value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })}
                placeholder="Port" type="number" className="cq-input" />
              <input value={form.database} onChange={(e) => setForm({ ...form, database: e.target.value })}
                placeholder="Database name" required className="cq-input" />
              <input value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })}
                placeholder="Username" required className="cq-input" />
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password" className="cq-input sm:col-span-2" />
            </div>
          ) : (
            <div className="space-y-3">
              <input value={form.database} onChange={(e) => setForm({ ...form, database: e.target.value })}
                placeholder="SQLite file path (e.g. ./data/app.db)" required className="cq-input" />
              <p className="text-xs text-faint">Or paste a full connection URL below instead.</p>
            </div>
          )}

          <input value={form.connection_url} onChange={(e) => setForm({ ...form, connection_url: e.target.value })}
            placeholder="Optional full connection URL (overrides fields above)"
            className="cq-input font-mono text-sm" />

          <div className="flex gap-2">
            <button type="submit" className="cq-btn cq-btn-primary">Save connection</button>
            <button type="button" onClick={() => setShowForm(false)} className="cq-btn cq-btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {databases.map((db) => {
          const meta = typeMeta(db.type)
          const result = testResult[db.id]
          return (
            <div key={db.id} className="cq-card cq-card-hover p-5">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)` }}>
                  <Database className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <button onClick={() => remove(db.id)} className="p-1.5 rounded-lg text-faint hover:bg-red-500/10 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-semibold mt-3 truncate">{db.name}</h3>
              <p className="text-sm text-muted">{meta.label}</p>

              <div className="mt-3 space-y-1 text-xs text-faint">
                {db.host && (
                  <p className="flex items-center gap-1.5"><Server className="w-3 h-3" /> {db.host}{db.port ? `:${db.port}` : ''}</p>
                )}
                {db.database && <p>DB · {db.database}</p>}
                {db.user && <p>User · {db.user}</p>}
                <p className="font-mono truncate" title={db.connection_url}>{db.connection_url}</p>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => test(db.id)}
                  disabled={testing === db.id}
                  className="cq-btn cq-btn-ghost !px-2.5 !py-1.5 !text-xs"
                >
                  <Plug className="w-3 h-3" />
                  {testing === db.id ? 'Testing…' : 'Test'}
                </button>
                {result && (
                  <span className={`inline-flex items-center gap-1 text-xs ${result.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                    {result.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {result.ok ? `${result.latency_ms}ms` : 'Failed'}
                  </span>
                )}
              </div>
              {result && !result.ok && (
                <p className="text-xs text-red-500 mt-2 line-clamp-2">{result.message}</p>
              )}
            </div>
          )
        })}
      </div>

      {databases.length === 0 && !showForm && (
        <div className="text-center py-14 rounded-2xl border border-dashed border-token">
          <Database className="w-10 h-10 mx-auto mb-3 text-faint" />
          <p className="text-muted mb-4">No database connections yet.</p>
          <button onClick={() => setShowForm(true)} className="cq-btn cq-btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Connect your first database
          </button>
        </div>
      )}
    </div>
  )
}
