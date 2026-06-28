import { useEffect, useState } from 'react'
import { Shield, Smartphone, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [enroll, setEnroll] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const startEnroll = async () => {
    setBusy(true); setError('')
    try {
      const data = await api.mfaEnroll()
      setEnroll(data)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const verify = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api.mfaVerify(code)
      setEnroll(null); setCode(''); setMsg('Two-factor authentication enabled.')
      await refreshUser?.()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const disable = async () => {
    if (!confirm('Disable two-factor authentication?')) return
    await api.mfaDisable()
    setMsg('MFA disabled.')
    await refreshUser?.()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <h1 className="text-3xl font-bold tracking-tight mb-1">Settings</h1>
      <p className="text-muted mb-7">Account security and preferences</p>

      {msg && <div className="mb-4 p-3 rounded-xl text-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">{msg}</div>}
      {error && <div className="mb-4 p-3 rounded-xl text-sm border border-red-500/30 bg-red-500/10 text-red-500">{error}</div>}

      <div className="cq-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-soft)' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="font-semibold">Two-factor authentication</h2>
            <p className="text-sm text-muted">Protect your account with an authenticator app</p>
          </div>
          {user?.mfa_enabled ? (
            <span className="ml-auto flex items-center gap-1 text-sm text-emerald-500"><CheckCircle className="w-4 h-4" /> Enabled</span>
          ) : (
            <span className="ml-auto flex items-center gap-1 text-sm text-faint"><XCircle className="w-4 h-4" /> Off</span>
          )}
        </div>

        {user?.mfa_enabled ? (
          <button type="button" onClick={disable} className="cq-btn cq-btn-ghost text-red-500">Disable MFA</button>
        ) : enroll ? (
          <form onSubmit={verify} className="space-y-4">
            <p className="text-sm text-muted flex items-center gap-2"><Smartphone className="w-4 h-4" /> Scan this URI in Google Authenticator or 1Password:</p>
            <code className="block text-xs p-3 rounded-xl cq-surface-2 break-all">{enroll.otpauth_uri}</code>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" className="cq-input max-w-xs" required />
            <button type="submit" disabled={busy} className="cq-btn cq-btn-primary">Verify & enable</button>
          </form>
        ) : (
          <button type="button" onClick={startEnroll} disabled={busy} className="cq-btn cq-btn-primary">
            Set up authenticator
          </button>
        )}
      </div>
    </div>
  )
}
