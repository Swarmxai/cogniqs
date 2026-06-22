/**
 * AddFirstStepPlaceholder — Empty canvas placeholder (ported from mindscrybe).
 * "Add first step" / "What triggers this workflow?".
 */

import { Plus } from 'lucide-react';

export function AddFirstStepPlaceholder({ onAdd }) {
  return (
    <div className="add-first-step" onClick={() => onAdd('trigger')}>
      <div className="add-first-step-dashed">
        <Plus size={48} className="add-first-step-plus" />
        <span className="add-first-step-text">What triggers this workflow?</span>
        <span className="add-first-step-sub">Add first step...</span>
      </div>
    </div>
  );
}
