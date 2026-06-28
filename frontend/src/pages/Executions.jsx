import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, ChevronRight, X, RefreshCw } from 'lucide-react'
import { api } from '../api/client'

const statusIcon = {
  success: CheckCircle,
  error: XCircle,
  running: Clock,
}

function JsonBlock({ data }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return <p className="text-sm text-muted">No data</p>
  }
  return (
    <pre className="text-xs font-mono p-3 rounded-xl cq-surface-2 overflow-auto max-h-64 whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export default function Executions() {
  const [executions, setExecutions] = useState([])
  const [workflows, setWorkflows] = useState({})
  const [selected, setSelected] = useState(null)

  const load = () => {
    Promise.all([api.getExecutions(), api.getWorkflows()])
      .then(([ex, wf]) => {
        setExecutions(ex)
        const map = {}
        wf.forEach((w) => { map[w.id] = w.name })
        setWorkflows(map)
      })
      .catch(console.error)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Executions</h1>
          <p className="text-muted">Run history with full output inspection</p>
        </div>
        <button type="button" onClick={load} className="cq-btn cq-btn-ghost"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <div className="cq-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-token text-left text-muted">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Workflow</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {executions.map((ex) => {
              const Icon = statusIcon[ex.status] || Clock
              return (
                <tr key={ex.id} className="border-b border-token hover:bg-[var(--surface-2)] cursor-pointer"
                  onClick={() => setSelected(ex)}>
                  <td className="px-4 py-3 font-mono text-xs">#{ex.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/workflows/${ex.workflow_id}`} className="hover:underline" style={{ color: 'var(--primary)' }}
                      onClick={(e) => e.stopPropagation()}>
                      {workflows[ex.workflow_id] || `Workflow ${ex.workflow_id}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 ${
                      ex.status === 'success' ? 'text-emerald-500' : ex.status === 'error' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                      {ex.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(ex.started_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-faint"><ChevronRight className="w-4 h-4" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {executions.length === 0 && (
          <p className="text-center py-12 text-muted">No executions yet — run a workflow to see history here</p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="cq-card max-w-3xl w-full max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-semibold text-lg">Execution #{selected.id}</h3>
                <p className="text-sm text-muted">
                  {workflows[selected.workflow_id] || `Workflow ${selected.workflow_id}`} · {selected.status}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-faint mb-2">Trigger data</h4>
                <JsonBlock data={selected.trigger_data} />
              </div>
              {selected.error && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-red-400 mb-2">Error</h4>
                  <p className="text-sm text-red-400 p-3 rounded-xl bg-red-500/10">{selected.error}</p>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-faint mb-2">Result</h4>
                <JsonBlock data={selected.result} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
