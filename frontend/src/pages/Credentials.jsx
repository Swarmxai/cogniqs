import { useEffect, useState } from 'react'
import { Key, Plus, Trash2, Shield, Pencil } from 'lucide-react'
import { api } from '../api/client'

const CRED_TYPES = [
  { value: 'openai', label: 'OpenAI API Key' },
  { value: 'anthropic', label: 'Anthropic API Key' },
  { value: 'google', label: 'Google AI API Key' },
  { value: 'groq', label: 'Groq API Key' },
  { value: 'mistral', label: 'Mistral API Key' },
  { value: 'deepseek', label: 'DeepSeek API Key' },
  { value: 'azure_openai', label: 'Azure OpenAI' },
  { value: 'custom', label: 'Custom' },
]

const emptyForm = () => ({
  name: '',
  type: 'openai',
  apiKey: '',
  endpoint: '',
  deployment: '',
  apiVersion: '2024-02-01',
})

export default function Credentials() {
  const [creds, setCreds] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => api.getCredentials().then(setCreds).catch(console.error)
  useEffect(() => { load() }, [])

  const isAzure = form.type === 'azure_openai'

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const buildData = () => {
    const data = {}
    if (form.apiKey) data.apiKey = form.apiKey
    if (isAzure) {
      data.endpoint = form.endpoint
      data.deployment = form.deployment
      data.apiVersion = form.apiVersion
    }
    return data
  }

  const create = async (e) => {
    e.preventDefault()
    await api.createCredential({ name: form.name, type: form.type, data: buildData() })
    resetForm()
    load()
  }

  const openEdit = (cred) => {
    setEditingId(cred.id)
    setShowForm(false)
    setForm({
      name: cred.name,
      type: cred.type,
      apiKey: '',
      endpoint: '',
      deployment: '',
      apiVersion: '2024-02-01',
    })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    const payload = { name: form.name }
    const data = buildData()
    if (Object.keys(data).length) payload.data = data
    await api.updateCredential(editingId, payload)
    resetForm()
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this credential?')) return
    await api.deleteCredential(id)
    if (editingId === id) resetForm()
    load()
  }

  const formVisible = showForm || editingId != null

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Credential Vault</h1>
          <p className="text-muted">Securely store API keys for your workflows</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="cq-btn cq-btn-primary">
          <Plus className="w-4 h-4" /> Add Credential
        </button>
      </div>

      <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6 border" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: '#34d399' }}>
        <Shield className="w-4 h-4 flex-shrink-0" />
        Credentials are encrypted at rest. Keys are never exposed after saving — use them in workflow nodes via the Credential picker.
      </div>

      {formVisible && (
        <form onSubmit={editingId ? saveEdit : create} className="cq-card p-6 mb-6 space-y-4">
          <h3 className="font-semibold">{editingId ? 'Edit Credential' : 'New Credential'}</h3>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Credential name"
            required
            className="cq-input"
          />
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            disabled={!!editingId}
            className="cq-input"
          >
            {CRED_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {isAzure && (
            <>
              <input
                value={form.endpoint}
                onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))}
                placeholder="Azure endpoint — https://your-resource.openai.azure.com"
                required={!editingId}
                className="cq-input"
              />
              <input
                value={form.deployment}
                onChange={(e) => setForm((f) => ({ ...f, deployment: e.target.value }))}
                placeholder="Deployment name — e.g. gpt-4o-mini"
                required={!editingId}
                className="cq-input"
              />
              <input
                value={form.apiVersion}
                onChange={(e) => setForm((f) => ({ ...f, apiVersion: e.target.value }))}
                placeholder="API version — 2024-02-01"
                required={!editingId}
                className="cq-input"
              />
            </>
          )}
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder={editingId ? 'New API key (leave blank to keep existing)' : 'API Key'}
            required={!editingId}
            className="cq-input font-mono"
          />
          <div className="flex gap-2">
            <button type="submit" className="cq-btn cq-btn-primary">{editingId ? 'Update' : 'Save'}</button>
            <button type="button" onClick={resetForm} className="cq-btn cq-btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {creds.map((c) => (
          <div key={c.id} className="cq-card cq-card-hover p-5">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #f59e0b 14%, transparent)' }}>
                <Key className="w-4 h-4" style={{ color: '#f59e0b' }} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)]" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg text-faint hover:bg-red-500/10 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold mt-3">{c.name}</h3>
            <p className="text-sm text-muted">{c.type}</p>
            <p className="text-xs text-faint mt-2">Added {new Date(c.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
      {creds.length === 0 && !formVisible && (
        <p className="text-center py-12 text-muted">No credentials stored yet</p>
      )}
    </div>
  )
}
