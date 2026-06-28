/**
 * ExecutionHistory — Right-side drawer wired to Cogniqs API.
 */

import { useCallback, useEffect, useState } from 'react'
import { X, CheckCircle, XCircle, Clock, Loader } from 'lucide-react'
import { api } from '../../api/client'

function norm(status) {
  if (!status) return status
  const s = String(status).toLowerCase()
  return s === 'failed' ? 'error' : s
}

function StatusIcon({ status }) {
  const s = norm(status)
  if (s === 'success') return <CheckCircle size={16} className="exec-icon--success" />
  if (s === 'error') return <XCircle size={16} className="exec-icon--error" />
  if (s === 'running') return <Loader size={16} className="exec-icon--running" />
  return <Clock size={16} className="exec-icon--pending" />
}

function durationMs(ex) {
  if (!ex.started_at || !ex.finished_at) return null
  const ms = new Date(ex.finished_at) - new Date(ex.started_at)
  return Number.isFinite(ms) ? ms : null
}

export function ExecutionHistory({ workflowId, open, onClose, onSelectExecution, refreshKey }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(() => {
    if (!workflowId) return
    setLoading(true)
    api.getExecutions(workflowId)
      .then((rows) => {
        const all = Array.isArray(rows) ? rows : rows?.items || []
        setList(all)
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [workflowId])

  useEffect(() => {
    if (open && workflowId) reload()
  }, [open, workflowId, refreshKey, reload])

  if (!open) return null

  return (
    <div className="cq-panel cq-panel--drawer">
      <div className="cq-panel-header">
        <div className="cq-panel-header-text">
          <h3 className="cq-panel-title">Execution History</h3>
          <p className="cq-panel-subtitle">{list.length} run{list.length !== 1 ? 's' : ''}</p>
        </div>
        <button type="button" className="cq-panel-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="cq-panel-body">
        {loading ? (
          <div className="cq-panel-empty">Loading…</div>
        ) : list.length === 0 ? (
          <div className="cq-panel-empty">
            <Clock size={28} style={{ opacity: 0.25, marginBottom: 8 }} />
            <div>No executions yet</div>
          </div>
        ) : (
          list.map((ex) => {
            const ms = durationMs(ex)
            const st = norm(ex.status)
            return (
              <button
                key={ex.id}
                type="button"
                className="cq-exec-item"
                onClick={() => onSelectExecution?.(ex)}
              >
                <StatusIcon status={ex.status} />
                <div className="cq-exec-item-info">
                  <div className="cq-exec-item-id">Run #{ex.id}</div>
                  <div className="cq-exec-item-time">
                    {ex.started_at ? new Date(ex.started_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div className="cq-exec-item-meta">
                  <span className={`cq-exec-badge cq-exec-badge--${st === 'success' ? 'success' : st === 'error' ? 'error' : 'running'}`}>
                    {st === 'success' ? 'Success' : st === 'error' ? 'Failed' : st || 'Pending'}
                  </span>
                  {ms != null && <span className="cq-exec-duration">{ms.toFixed(0)}ms</span>}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
