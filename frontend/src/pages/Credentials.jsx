import { useEffect, useState } from 'react'
import { Key, Plus, Trash2, Shield } from 'lucide-react'
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

export default function Credentials() {
  const [creds, setCreds] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('openai')
  const [apiKey, setApiKey] = useState('')

  const load = () => api.getCredentials().then(setCreds).catch(console.error)
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    await api.createCredential({ name, type, data: { apiKey } })
    setShowForm(false)
    setName('')
    setApiKey('')
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this credential?')) return
    await api.deleteCredential(id)
    load()
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Credential Vault</h1>
          <p className="text-muted">Securely store API keys for your workflows</p>
        </div>
        <button onClick={() => setShowForm(true)} className="cq-btn cq-btn-primary">
          <Plus className="w-4 h-4" /> Add Credential
        </button>
      </div>

      <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6 border" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: '#34d399' }}>
        <Shield className="w-4 h-4 flex-shrink-0" />
        Credentials are encrypted at rest using Fernet encryption. Keys are never exposed after saving.
      </div>

      {showForm && (
        <form onSubmit={create} className="cq-card p-6 mb-6 space-y-4">
          <h3 className="font-semibold">New Credential</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Credential name" required className="cq-input" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="cq-input">
            {CRED_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key" required className="cq-input font-mono" />
          <div className="flex gap-2">
            <button type="submit" className="cq-btn cq-btn-primary">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="cq-btn cq-btn-ghost">Cancel</button>
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
              <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg text-faint hover:bg-red-500/10 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-semibold mt-3">{c.name}</h3>
            <p className="text-sm text-muted">{c.type}</p>
            <p className="text-xs text-faint mt-2">Added {new Date(c.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
      {creds.length === 0 && !showForm && (
        <p className="text-center py-12 text-muted">No credentials stored yet</p>
      )}
    </div>
  )
}
