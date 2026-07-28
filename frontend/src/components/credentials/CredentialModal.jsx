import { useEffect, useRef, useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import {
  CREDENTIAL_TYPES, CREDENTIAL_PURPOSES, resolveCredType,
} from '../../lib/credentialTypes'
import './credentials.css'

function defaultsForType(type) {
  const def = CREDENTIAL_TYPES.find((t) => t.value === type)
  const out = {}
  for (const f of def?.fields || []) {
    if (f.defaultValue) out[f.key] = f.defaultValue
  }
  return out
}

export default function CredentialModal({ editData, onClose, onSave }) {
  const isEdit = !!editData
  const nameRef = useRef(null)
  const initialType = resolveCredType(editData?.type || 'openai')

  const [name, setName] = useState(editData?.name || '')
  const [type, setType] = useState(initialType)
  const [purpose, setPurpose] = useState(editData?.purpose || 'general')
  const [fields, setFields] = useState(editData?.fields || defaultsForType(initialType))
  const [showSecret, setShowSecret] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const typeDef = CREDENTIAL_TYPES.find((t) => t.value === type)

  useEffect(() => {
    nameRef.current?.focus()
    const onEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  const changeType = (next) => {
    setType(next)
    setFields(defaultsForType(next))
    setShowSecret({})
    setError('')
  }

  const setField = (key, value) => setFields((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Credential name is required')
      return
    }

    const missing = (typeDef?.fields || [])
      .filter((f) => f.required && !fields[f.key]?.trim() && !(isEdit && f.secret))
      .map((f) => f.label)
    if (missing.length) {
      setError(`Required: ${missing.join(', ')}`)
      return
    }

    const data = { purpose }
    for (const f of typeDef?.fields || []) {
      const val = fields[f.key]?.trim()
      if (val) data[f.key] = val
    }

    const payload = { name: name.trim(), type, data }
    if (isEdit && Object.keys(data).length <= 1 && !Object.keys(data).some((k) => k !== 'purpose')) {
      payload.data = undefined
    }

    setSaving(true)
    setError('')
    try {
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save credential')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form
        className="cq-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{isEdit ? 'Edit Credential' : 'New Credential'}</h2>
            <p className="text-sm text-muted">Securely store provider API keys for agents & workflows</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="block text-xs text-faint mb-1">Credential name</label>
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Production OpenAI Key"
          className="cq-input mb-4"
          required
        />

        {!isEdit && (
          <>
            <label className="block text-xs text-faint mb-2">Provider</label>
            <div className="cred-provider-grid mb-2">
              {CREDENTIAL_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`cred-provider-btn ${type === t.value ? 'cred-provider-btn--active' : ''}`}
                  onClick={() => changeType(t.value)}
                >
                  <t.icon />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {isEdit && typeDef && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl cq-surface-2">
            <typeDef.icon />
            <span className="font-medium text-sm">{typeDef.label}</span>
          </div>
        )}

        {typeDef && <p className="cred-provider-desc mb-4">{typeDef.description}</p>}

        <label className="block text-xs text-faint mb-1">Purpose</label>
        <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="cq-input mb-4">
          {CREDENTIAL_PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <p className="cred-provider-desc mb-4">
          {CREDENTIAL_PURPOSES.find((p) => p.value === purpose)?.description}
        </p>

        {(typeDef?.fields || []).map((field) => (
          <div key={field.key} className="mb-3">
            <label className="block text-xs text-faint mb-1">
              {field.label}
              {field.required && !isEdit && ' *'}
            </label>
            <div className={field.secret ? 'cred-secret-wrap' : ''}>
              <input
                type={field.secret && !showSecret[field.key] ? 'password' : 'text'}
                value={fields[field.key] || ''}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={isEdit && field.secret ? '•••••••• (leave blank to keep)' : field.placeholder}
                className="cq-input font-mono text-sm"
                autoComplete="off"
                required={field.required && !isEdit}
              />
              {field.secret && (
                <button
                  type="button"
                  className="cred-eye-btn"
                  onClick={() => setShowSecret((s) => ({ ...s, [field.key]: !s[field.key] }))}
                >
                  {showSecret[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="mb-3 p-3 rounded-xl text-sm border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button type="submit" disabled={saving} className="cq-btn cq-btn-primary flex-1">
            {saving ? 'Saving…' : isEdit ? 'Update Credential' : 'Save Credential'}
          </button>
          <button type="button" onClick={onClose} className="cq-btn cq-btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  )
}
