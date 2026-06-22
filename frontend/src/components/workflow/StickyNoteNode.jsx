/**
 * StickyNoteNode — Decorative sticky note on the canvas (ported from mindscrybe).
 * Color-coded, inline editable.
 */

import { memo, useState } from 'react';

const COLORS = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#f3e8ff'];

function StickyNoteInner({ data, selected }) {
  const [editing, setEditing] = useState(false);
  const color = data.color || COLORS[0];

  return (
    <div
      className={`sticky-note ${selected ? 'sticky-note--selected' : ''}`}
      style={{ background: color, minWidth: 160, minHeight: 100 }}
      onDoubleClick={() => setEditing(true)}
    >
      {editing ? (
        <textarea
          className="sticky-note-input"
          defaultValue={data.text || ''}
          autoFocus
          onBlur={(e) => {
            setEditing(false);
            data.onTextChange?.(e.target.value);
          }}
        />
      ) : (
        <div className="sticky-note-text">
          {data.text || 'Double-click to edit'}
        </div>
      )}
    </div>
  );
}

export const StickyNoteNode = memo(StickyNoteInner);
