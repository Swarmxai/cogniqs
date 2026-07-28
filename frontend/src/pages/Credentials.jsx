import { useEffect, useState } from 'react'
import { Key, Plus, Trash2, Shield, Pencil } from 'lucide-react'
import { api } from '../api/client'
import { getCredTypeDef, resolveCredType, CREDENTIAL_PURPOSES } from '../lib/credentialTypes'
import CredentialModal from '../components/credentials/CredentialModal'
import '../components/credentials/credentials.css'

export default function Credentials() {
  const [creds, setCreds] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)

  const load = () => api.getCredentials().then(setCreds).catch(console.error)
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditData(null)
    setShowModal(true)
  }

  const openEdit = async (cred) => {
    let meta = {}
    try {
      meta = await api.getCredentialMeta(cred.id)
    } catch { /* non-secret fields only */ }
    setEditData({
      id: cred.id,
      name: cred.name,
      type: cred.type,
      purpose: meta.purpose || 'general',
      fields: {
        endpoint: meta.endpoint || '',
        deployment: meta.deployment || '',
        apiVersion: meta.apiVersion || '2024-02-01',
        baseUrl: meta.baseUrl || '',
        organization: meta.organization || '',
        projectId: meta.projectId || '',
        model: meta.model || '',
      },
    })
    setShowModal(true)
  }

  const handleSave = async (payload) => {
    if (editData?.id) {
      const patch = { name: payload.name }
      if (payload.data && Object.keys(payload.data).length) patch.data = payload.data
      await api.updateCredential(editData.id, patch)
    } else {
      await api.createCredential(payload)
    }
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
          <p className="text-muted">Store OpenAI, Azure, Anthropic, and other provider keys — used by AI Agents & workflow nodes</p>
        </div>
        <button onClick={openCreate} className="cq-btn cq-btn-primary">
          <Plus className="w-4 h-4" /> Add Credential
        </button>
      </div>

      <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6 border" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: '#34d399' }}>
        <Shield className="w-4 h-4 flex-shrink-0" />
        Credentials are AES-encrypted at rest. OpenAI keys support optional Organization ID (org-...) like Mindscrybe.
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {creds.map((c) => {
          const td = getCredTypeDef(c.type)
          const Icon = td?.icon
          return (
            <div key={c.id} className="cq-card cq-card-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="cred-card-logo shrink-0">
                    {Icon ? <Icon /> : <Key className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{c.name}</h3>
                    <p className="text-sm text-muted">{td?.label || resolveCredType(c.type)}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-faint hover:bg-[var(--surface-2)]" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg text-faint hover:bg-red-500/10 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-faint mt-3">Added {new Date(c.created_at).toLocaleDateString()}</p>
            </div>
          )
        })}
      </div>

      {creds.length === 0 && (
        <p className="text-center py-12 text-muted">No credentials yet — add your OpenAI or other provider key to get started</p>
      )}

      {showModal && (
        <CredentialModal
          editData={editData}
          onClose={() => { setShowModal(false); setEditData(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
