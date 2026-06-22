import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Sparkles, Workflow, Cpu, Boxes } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register, isAuthenticated } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('demo@cogniqs.dev')
  const [password, setPassword] = useState('demo1234')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, name)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-12 flex-col justify-between text-white"
        style={{ backgroundImage: 'var(--grad-hero)' }}>
        <div className="absolute inset-0 cq-grid-bg opacity-20" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full blur-3xl opacity-30 bg-white animate-glow" />
        <div className="relative flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </span>
          <span className="text-2xl font-bold">Cogniqs</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] mb-5">
            Build GenAI workflows<br />without writing code
          </h1>
          <p className="text-white/80 text-lg max-w-md mb-8">
            Visual drag-and-drop automation for LLMs, agents, RAG pipelines, AutoML, and integrations — built for developers.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Workflow, label: 'Visual Workflows' },
              { icon: Cpu, label: 'No-Code AutoML' },
              { icon: Boxes, label: 'Vector RAG' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 backdrop-blur text-sm font-medium">
                <Icon className="w-4 h-4" /> {label}
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-white/70 text-sm">© 2026 Cogniqs · GenAI Low-Code Platform</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <form onSubmit={submit} className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center neon-ring"
              style={{ backgroundImage: 'var(--grad-brand)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            <span className="font-bold text-lg gradient-text">Cogniqs</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="text-muted mb-6 text-sm">
            {mode === 'login' ? 'Sign in to your workspace' : 'Start building AI workflows'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm border"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          {mode === 'register' && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cq-input mb-3"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="cq-input mb-3"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="cq-input mb-4"
          />
          <button type="submit" disabled={loading} className="cq-btn cq-btn-primary w-full !py-2.5">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <p className="mt-4 text-center text-sm text-muted">
            {mode === 'login' ? (
              <>No account?{' '}
                <button type="button" onClick={() => setMode('register')} className="font-semibold" style={{ color: 'var(--primary)' }}>Register</button>
              </>
            ) : (
              <>Have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="font-semibold" style={{ color: 'var(--primary)' }}>Sign in</button>
              </>
            )}
          </p>
          {mode === 'login' && (
            <p className="mt-3 text-center text-xs text-faint">
              Demo · demo@cogniqs.dev / demo1234
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
