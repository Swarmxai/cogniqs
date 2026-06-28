import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Sparkles, Workflow, Wand2, Bot, Mail, Lock, User,
  Eye, EyeOff, Moon, Sun, ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const FEATURES = [
  {
    icon: Workflow,
    title: 'Visual workflows',
    desc: 'Drag-and-drop GenAI automations with agents, RAG, and integrations.',
  },
  {
    icon: Wand2,
    title: 'Auto ML studio',
    desc: 'Train production models from datasets — no workflow required.',
  },
  {
    icon: Bot,
    title: 'AI agents',
    desc: 'Deploy conversational agents with memory, tools, and live chat.',
  },
]

export default function Login() {
  const { login, register, isAuthenticated } = useAuth()
  const { dark, toggle } = useTheme()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('demo@cogniqs.dev')
  const [password, setPassword] = useState('demo1234')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  if (isAuthenticated) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = mode === 'login'
        ? await login(email, password, mfaStep ? mfaCode : undefined)
        : await register(email, password, name)
      if (res?.mfaRequired) {
        setMfaStep(true)
        return
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail('demo@cogniqs.dev')
    setPassword('demo1234')
    setMode('login')
  }

  return (
    <div className="cq-login-page">
      {/* Brand panel */}
      <aside className="cq-login-brand">
        <div className="cq-login-grid" />
        <div className="cq-login-orb" style={{ width: 280, height: 280, top: -80, right: -60, background: '#a855f7' }} />
        <div className="cq-login-orb" style={{ width: 220, height: 220, bottom: 40, left: -40, background: '#2563eb', animationDelay: '1.5s' }} />

        <div className="relative flex items-center gap-3 z-10">
          <span className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Sparkles className="w-6 h-6 text-white" />
          </span>
          <div>
            <div className="text-xl font-bold">Cogniqs</div>
            <div className="text-xs text-white/70 tracking-wide uppercase">GenAI Studio</div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl xl:text-[2.75rem] font-extrabold leading-[1.08] mb-4">
            Build intelligence.<br />Ship faster.
          </h1>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            The low-code platform for workflows, Auto ML, and AI agents — designed for teams who move fast.
          </p>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="cq-login-feature">
                <div className="cq-login-feature-icon">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{title}</div>
                  <div className="text-xs text-white/75 mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/60 text-xs">© 2026 Cogniqs · All rights reserved</p>
      </aside>

      {/* Form panel */}
      <div className="cq-login-form-side">
        <button type="button" className="cq-login-theme-btn" onClick={toggle} aria-label="Toggle theme">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="cq-login-card">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center neon-ring"
              style={{ backgroundImage: 'var(--grad-brand)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            <span className="font-bold text-lg gradient-text">Cogniqs</span>
          </div>

          <div className="cq-login-tabs">
            <button
              type="button"
              className={`cq-login-tab ${mode === 'login' ? 'cq-login-tab--active' : ''}`}
              onClick={() => setMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`cq-login-tab ${mode === 'register' ? 'cq-login-tab--active' : ''}`}
              onClick={() => setMode('register')}
            >
              Create account
            </button>
          </div>

          <h2 className="text-xl font-bold mb-1">
            {mode === 'login' ? 'Welcome back' : 'Get started free'}
          </h2>
          <p className="text-sm text-muted mb-6">
            {mode === 'login'
              ? 'Enter your credentials to access your workspace'
              : 'Create an account and start building in minutes'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm border"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div className="cq-login-field">
                <label htmlFor="name">Full name</label>
                <div className="cq-login-input-wrap">
                  <User />
                  <input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="cq-login-field">
              <label htmlFor="email">Email address</label>
              <div className="cq-login-input-wrap">
                <Mail />
                <input
                  id="email"
                  data-testid="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="cq-login-field">
              <label htmlFor="password">Password</label>
              <div className="cq-login-input-wrap cq-login-input-wrap--password">
                <Lock />
                <input
                  id="password"
                  data-testid="login-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="cq-login-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mfaStep && (
              <div className="cq-login-field">
                <label htmlFor="mfa">Authenticator code</label>
                <div className="cq-login-input-wrap">
                  <Lock />
                  <input
                    id="mfa"
                    data-testid="login-mfa"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} data-testid="login-submit" className="cq-btn cq-btn-primary w-full !py-2.5 mt-2">
              {loading ? 'Please wait…' : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="cq-login-demo">
              <span>Try the demo: </span>
              <button type="button" onClick={fillDemo} className="font-semibold underline-offset-2 hover:underline"
                style={{ color: 'var(--primary)' }}>
                demo@cogniqs.dev
              </button>
              <span> / </span>
              <strong>demo1234</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
