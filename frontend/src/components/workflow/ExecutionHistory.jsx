/**
 * ExecutionHistory — Right-side drawer (mindscrybe-style), wired to Cogniqs API.
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
  if (s === 'success') return <CheckCircle size={14} className="exec-icon--success" />
  if (s === 'error') return <XCircle size={14} className="exec-icon--error" />
  if (s === 'running') return <Loader size={14} className="exec-icon--running" />
  return <Clock size={14} className="exec-icon--pending" />
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
    <div className="exec-drawer">
      <div className="exec-drawer-header">
        <h3>Execution History</h3>
        <button type="button" className="ndv-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div className="exec-drawer-body">
        {loading ? (
          <div className="exec-drawer-empty">Loading…</div>
        ) : list.length === 0 ? (
          <div className="exec-drawer-empty">
            <Clock size={24} style={{ opacity: 0.3 }} />
            <p>No executions yet</p>
          </div>
        ) : (
          <div className="exec-drawer-list">
            {list.map((ex) => {
              const ms = durationMs(ex)
              const st = norm(ex.status)
              return (
                <button
                  key={ex.id}
                  type="button"
                  className="exec-drawer-item"
                  onClick={() => onSelectExecution?.(ex)}
                >
                  <StatusIcon status={ex.status} />
                  <div className="exec-drawer-item-info">
                    <div className="exec-drawer-item-id">#{ex.id}</div>
                    <div className="exec-drawer-item-time">
                      {ex.started_at ? new Date(ex.started_at).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div className="exec-drawer-item-meta">
                    <span className={`status-pill status-pill--${st === 'success' ? 'active' : 'inactive'}`}>
                      {st === 'success' ? '✓ Success' : st === 'error' ? '✕ Error' : st === 'running' ? '● Running' : ex.status}
                    </span>
                    <span className="exec-drawer-item-duration">
                      {ms != null ? `${ms.toFixed(0)}ms` : ''}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
