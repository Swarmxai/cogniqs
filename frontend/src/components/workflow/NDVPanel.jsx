/**
 * NDVPanel — Node Details View with credential picker and rich field types.
 */

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { NodeIcon } from './icons/NodeIcons'
import { api } from '../../api/client'
import { isPropertyVisible, credentialTypes } from './ndvUtils'

function JsonBlock({ data, empty }) {
  if (data == null || (typeof data === 'object' && !Object.keys(data).length)) {
    return <div className="ndv-io-empty">{empty}</div>
  }
  return <pre className="ndv-io-pre">{JSON.stringify(data, null, 2)}</pre>
}

function PropertyField({ prop, value, onChange }) {
  const type = prop.type
  const rows = prop.typeOptions?.rows || (type === 'code' || type === 'json' ? 6 : 3)

  if (type === 'boolean') {
    return (
      <label className="ndv-settings-row">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span>{value ? 'Enabled' : 'Disabled'}</span>
      </label>
    )
  }

  if (type === 'options') {
    return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {(prop.options || []).map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.name}{o.disabled ? ' (coming soon)' : ''}
          </option>
        ))}
      </select>
    )
  }

  if (type === 'notice') {
    return <p className="field-help ndv-notice">{prop.description || prop.displayName}</p>
  }

  if (type === 'code' || type === 'json' || (type === 'string' && rows > 1)) {
    return (
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={prop.placeholder}
      />
    )
  }

  if (type === 'number') {
    const min = prop.typeOptions?.minValue
    const max = prop.typeOptions?.maxValue
    const step = prop.typeOptions?.step
    return (
      <input
        type="number"
        value={value ?? prop.default ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder={prop.placeholder}
      />
    )
  }

  if (type === 'password') {
    return (
      <input
        type="password"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={prop.placeholder}
        autoComplete="off"
      />
    )
  }

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={prop.placeholder}
    />
  )
}

function CredentialSelector({ nodeMeta, value, credentials, onChange, onAutofill }) {
  const allowed = credentialTypes(nodeMeta)
  const filtered = allowed.length
    ? credentials.filter((c) => allowed.includes(c.type))
    : credentials

  return (
    <div className="ndv-field">
      <label>Credential</label>
      <select
        value={value ?? ''}
        onChange={async (e) => {
          const id = e.target.value
          onChange(id ? Number(id) : '')
          if (id && onAutofill) {
            try {
              const meta = await api.getCredentialMeta(id)
              onAutofill(meta)
            } catch {
              /* ignore */
            }
          }
        }}
      >
        <option value="">None — enter values manually or use server .env</option>
        {filtered.map((c) => (
          <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
        ))}
      </select>
      <p className="field-help">Optional. Select a saved credential from the vault to auto-fill connection fields.</p>
    </div>
  )
}

export default function NDVPanel({ node, nodeMeta, nodeResult, onChange, onClose }) {
  const [tab, setTab] = useState('parameters')
  const [credentials, setCredentials] = useState([])
  const [databases, setDatabases] = useState([])

  useEffect(() => {
    api.getCredentials().then(setCredentials).catch(() => setCredentials([]))
    if (node?.data?.type === 'database_query') {
      api.getDatabases().then(setDatabases).catch(() => setDatabases([]))
    }
  }, [node?.data?.type])

  if (!node) return null

  const params = node.data.parameters || {}
  const properties = nodeMeta?.properties || []
  const desc = node.data._desc || nodeMeta || {}
  const color = desc.color || '#6366f1'
  const icon = desc.icon || 'zap'
  const hasCredentials = (nodeMeta?.credentials || []).length > 0

  const patchParams = (patch) => {
    onChange({
      ...node,
      data: {
        ...node.data,
        parameters: { ...params, ...patch },
      },
    })
  }

  const update = (name, value) => patchParams({ [name]: value })

  const autofillFromCredential = (meta) => {
    const mapping = {
      endpoint: meta.endpoint || meta.azure_endpoint,
      apiVersion: meta.apiVersion || meta.api_version,
      model: meta.deployment || meta.model,
      baseUrl: meta.baseUrl || meta.base_url,
    }
    const patch = {}
    for (const [key, val] of Object.entries(mapping)) {
      if (val) patch[key] = val
    }
    if (Object.keys(patch).length) patchParams(patch)
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

            {hasCredentials && (
              <CredentialSelector
                nodeMeta={nodeMeta}
                value={params._credentialId ?? ''}
                credentials={credentials}
                onChange={(id) => update('_credentialId', id || undefined)}
                onAutofill={autofillFromCredential}
              />
            )}

            {node.data.type === 'database_query' && databases.length > 0 && (
              <div className="ndv-field">
                <label>Saved database</label>
                <select
                  value={params.database_id ?? ''}
                  onChange={async (e) => {
                    const id = e.target.value ? Number(e.target.value) : undefined
                    update('database_id', id)
                    if (id) {
                      try {
                        const meta = await api.getDatabaseMeta(id)
                        if (meta.connection_url) update('connection_url', meta.connection_url)
                      } catch { /* ignore */ }
                    }
                  }}
                >
                  <option value="">— manual URL —</option>
                  {databases.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                  ))}
                </select>
                <p className="field-help">Pick a connection from Databases, or enter URL below.</p>
              </div>
            )}

            {properties.filter((prop) => isPropertyVisible(prop, params)).map((prop) => (
              <div key={prop.name} className="ndv-field">
                <label>
                  {prop.displayName}
                  {prop.required && <span className="ndv-required">*</span>}
                </label>
                <PropertyField
                  prop={prop}
                  value={params[prop.name] ?? prop.default ?? ''}
                  onChange={(val) => update(prop.name, val)}
                />
                {prop.description && prop.type !== 'notice' && (
                  <p className="field-help">{prop.description}</p>
                )}
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
            {nodeResult?.error && <div className="ndv-io-error">{nodeResult.error}</div>}
            <JsonBlock data={outputData} empty="No output yet. Execute the workflow or test this step." />
          </div>
        )}
      </div>
    </div>
  )
}
