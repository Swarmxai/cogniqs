/**
 * NDVPanel — Node Details View (mindscrybe-style popup).
 * Tabs: Parameters | Input | Output
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { NodeIcon } from './icons/NodeIcons'

import { isPropertyVisible } from './ndvUtils'

function isVisible(prop, params) {
  return isPropertyVisible(prop, params)
}

function JsonBlock({ data, empty }) {
  if (data == null || (typeof data === 'object' && !Object.keys(data).length)) {
    return <div className="ndv-io-empty">{empty}</div>
  }
  return (
    <pre className="ndv-io-pre">{JSON.stringify(data, null, 2)}</pre>
  )
}

export default function NDVPanel({ node, nodeMeta, nodeResult, onChange, onClose }) {
  const [tab, setTab] = useState('parameters')
  if (!node) return null

  const params = node.data.parameters || {}
  const properties = nodeMeta?.properties || []
  const desc = node.data._desc || nodeMeta || {}
  const color = desc.color || '#6366f1'
  const icon = desc.icon || 'zap'

  const update = (name, value) => {
    onChange({
      ...node,
      data: {
        ...node.data,
        parameters: { ...params, [name]: value },
      },
    })
  }

  const inputData = nodeResult?.inputData ?? nodeResult?.input_data
  const outputData = nodeResult?.outputData ?? nodeResult?.output_data ?? nodeResult?.output

  return (
    <div className="ndv-panel">
      <div className="ndv-header">
        <div className="ndv-icon" style={{ background: color }}>
          <NodeIcon name={icon} size={16} color="#fff" />
        </div>
        <h3>{node.data.customName || node.data.label || desc.displayName || node.data.type}</h3>
        <button type="button" className="ndv-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <div className="ndv-tabs">
        {['parameters', 'input', 'output'].map((t) => (
          <button
            key={t}
            type="button"
            className={`ndv-tab ${tab === t ? 'ndv-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'parameters' ? 'Parameters' : t === 'input' ? 'Input' : 'Output'}
            {t === 'output' && nodeResult?.status === 'success' && <span className="ndv-tab-dot ndv-tab-dot--success" />}
            {t === 'output' && (nodeResult?.status === 'error' || nodeResult?.status === 'failed') && (
              <span className="ndv-tab-dot ndv-tab-dot--error" />
            )}
          </button>
        ))}
      </div>

      <div className="ndv-body">
        {tab === 'parameters' && (
          <div className="ndv-params">
            <div className="ndv-field">
              <label>Display Name</label>
              <input
                value={node.data.label || ''}
                onChange={(e) => onChange({ ...node, data: { ...node.data, label: e.target.value } })}
                placeholder={desc.displayName || 'Node name'}
              />
            </div>
            {properties.filter((prop) => isVisible(prop, params)).map((prop) => (
              <div key={prop.name} className="ndv-field">
                <label>
                  {prop.displayName}
                  {prop.required && <span className="ndv-required">*</span>}
                </label>
                {prop.type === 'boolean' ? (
                  <label className="ndv-settings-row">
                    <input
                      type="checkbox"
                      checked={params[prop.name] ?? prop.default ?? false}
                      onChange={(e) => update(prop.name, e.target.checked)}
                    />
                    <span>{(params[prop.name] ?? prop.default) ? 'Enabled' : 'Disabled'}</span>
                  </label>
                ) : prop.type === 'options' ? (
                  <select
                    value={params[prop.name] ?? prop.default ?? ''}
                    onChange={(e) => update(prop.name, e.target.value)}
                  >
                    {(prop.options || []).map((o) => (
                      <option key={o.value} value={o.value} disabled={o.disabled}>
                        {o.name}{o.disabled ? ' (coming soon)' : ''}
                      </option>
                    ))}
                  </select>
                ) : prop.type === 'code' || prop.type === 'json' ? (
                  <textarea
                    value={params[prop.name] ?? prop.default ?? ''}
                    onChange={(e) => update(prop.name, e.target.value)}
                    rows={5}
                  />
                ) : (
                  <input
                    type={prop.type === 'number' ? 'number' : 'text'}
                    value={params[prop.name] ?? prop.default ?? ''}
                    onChange={(e) => update(prop.name, prop.type === 'number' ? Number(e.target.value) : e.target.value)}
                    placeholder={prop.placeholder}
                  />
                )}
                {prop.description && <p className="field-help">{prop.description}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'input' && (
          <div className="ndv-io">
            <JsonBlock data={inputData} empty="No input data yet. Execute the workflow to see input here." />
          </div>
        )}

        {tab === 'output' && (
          <div className="ndv-io">
            {nodeResult?.error && (
              <div className="ndv-io-error">{nodeResult.error}</div>
            )}
            <JsonBlock data={outputData} empty="No output yet. Execute the workflow or test this step." />
          </div>
        )}
      </div>
    </div>
  )
}
