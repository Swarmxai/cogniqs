/**
 * Empty canvas placeholder — Cogniqs branded.
 */

import { Radio } from 'lucide-react'

export function AddFirstStepPlaceholder({ onAdd }) {
  return (
    <div className="cq-first-step" onClick={() => onAdd('trigger')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onAdd('trigger')}>
      <div className="cq-first-step-card">
        <div className="cq-first-step-icon">
          <Radio size={32} strokeWidth={1.5} />
        </div>
        <span className="cq-first-step-title">Choose a starter block</span>
        <span className="cq-first-step-sub">Every flow begins with a trigger — pick how yours should launch</span>
      </div>
    </div>
  )
}
