import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { api } from '../api/client'

const statusIcon = {
  success: CheckCircle,
  error: XCircle,
  running: Clock,
}

export default function Executions() {
  const [executions, setExecutions] = useState([])

  useEffect(() => {
    api.getExecutions().then(setExecutions).catch(console.error)
  }, [])

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <h1 className="text-3xl font-bold tracking-tight mb-1">Executions</h1>
      <p className="text-muted mb-7">Run history across all workflows</p>

      <div className="cq-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-token text-left text-muted">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Workflow</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((ex) => {
              const Icon = statusIcon[ex.status] || Clock
              return (
                <tr key={ex.id} className="border-b border-token hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3 font-mono text-xs">#{ex.id}</td>
                  <td className="px-4 py-3">Workflow {ex.workflow_id}</td>
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
                </tr>
              )
            })}
          </tbody>
        </table>
        {executions.length === 0 && (
          <p className="text-center py-12 text-muted">No executions yet</p>
        )}
      </div>
    </div>
  )
}
