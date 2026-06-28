import { useEffect, useRef, useState } from 'react'
import {
  Bot, Plus, Trash2, Send, Settings, Mic, MessageSquare,
  AudioLines, ArrowLeft, Volume2, Pencil, Globe, Copy,
} from 'lucide-react'
import { api } from '../api/client'

const PROVIDERS = ['openai', 'anthropic', 'gemini', 'groq', 'mistral', 'deepseek', 'ollama']
const TTS_PROVIDERS = ['elevenlabs', 'openai', 'cartesia', 'playht']
const STT_PROVIDERS = ['deepgram', 'whisper', 'assemblyai']
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ar', label: 'Arabic' },
]

const emptyForm = () => ({
  name: '',
  agent_type: 'text',
  system_prompt: 'You are a helpful assistant.',
  provider: 'openai',
  model: 'gpt-4o-mini',
  // voice-only
  tts_provider: 'elevenlabs',
  voice_id: 'Rachel',
  stt_provider: 'deepgram',
  language: 'en',
  greeting: 'Hi! How can I help you today?',
  credential_id: null,
})

export default function AIAgent() {
  const [agents, setAgents] = useState([])
  const [active, setActive] = useState(null)
  const [editing, setEditing] = useState(null)
  const [credentials, setCredentials] = useState([])
  const [embedInfo, setEmbedInfo] = useState(null)
  const [step, setStep] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  const load = () => api.getAgents().then(setAgents).catch(console.error)
  useEffect(() => { load(); api.getCredentials().then(setCredentials).catch(() => {}) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const startCreate = () => { setForm(emptyForm()); setStep('type') }
  const cancel = () => { setStep(null); setForm(emptyForm()) }

  const pickType = (agent_type) => {
    setForm((f) => ({ ...f, agent_type }))
    setStep('form')
  }

  const create = async (e) => {
    e.preventDefault()
    const isVoice = form.agent_type === 'voice'
    const config = {
      agent_type: form.agent_type,
      ...(isVoice && {
        voice: {
          tts_provider: form.tts_provider,
          voice_id: form.voice_id,
          stt_provider: form.stt_provider,
          language: form.language,
          greeting: form.greeting,
        },
      }),
    }
    await api.createAgent({
      name: form.name,
      system_prompt: form.system_prompt,
      provider: form.provider,
      model: form.model,
      credential_id: form.credential_id || null,
      config,
    })
    cancel()
    load()
  }

  const remove = async (id) => {
    if (confirm('Delete agent?')) {
      await api.deleteAgent(id)
      if (active?.id === id) setActive(null)
      load()
    }
  }

  const selectAgent = (a) => { setActive(a); setMessages([]); setEditing(null) }

  const openEdit = (a) => {
    setEditing({
      id: a.id,
      name: a.name,
      system_prompt: a.system_prompt,
      provider: a.provider,
      model: a.model,
      credential_id: a.credential_id || null,
    })
    setActive(a)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editing) return
    const a = agents.find((x) => x.id === editing.id)
    await api.updateAgent(editing.id, {
      name: editing.name,
      description: a?.description || '',
      system_prompt: editing.system_prompt,
      provider: editing.provider,
      model: editing.model,
      credential_id: editing.credential_id || null,
      config: a?.config || {},
      published: a?.published || false,
    })
    setEditing(null)
    load()
  }

  const publish = async (id) => {
    const res = await api.publishAgent(id)
    setEmbedInfo(res)
    load()
  }

  const send = async () => {
    if (!input.trim() || !active) return
    const msg = input
    setMessages((m) => [...m, { role: 'user', content: msg }])
    setInput(''); setBusy(true)
    try {
      const res = await api.chatAgent(active.id, msg)
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally { setBusy(false) }
  }

  const isVoice = form.agent_type === 'voice'
  const agentType = (a) => a?.config?.agent_type || 'text'

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">AI Agents</h1>
          <p className="text-muted">Build voice & text agents you can reuse anywhere</p>
        </div>
        <button onClick={startCreate} data-testid="agent-new" className="cq-btn cq-btn-primary">
          <Plus className="w-4 h-4" /> New Agent
        </button>
      </div>

      {/* Step 1 — choose agent type */}
      {step === 'type' && (
        <div className="cq-card p-6 mb-6">
          <h3 className="font-semibold mb-1">What kind of agent do you want to build?</h3>
          <p className="text-muted text-sm mb-5">You can change the model and behaviour in the next step.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <button type="button" onClick={() => pickType('text')}
              className="cq-card cq-card-hover p-5 text-left">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'color-mix(in srgb, var(--primary) 14%, transparent)' }}>
                <MessageSquare className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </span>
              <p className="font-semibold mb-1">Text Agent</p>
              <p className="text-sm text-muted">Chat-based assistant powered by an LLM. Great for support, RAG and tools.</p>
            </button>

            <button type="button" onClick={() => pickType('voice')}
              className="cq-card cq-card-hover p-5 text-left">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'color-mix(in srgb, #8b5cf6 16%, transparent)' }}>
                <Mic className="w-5 h-5" style={{ color: '#8b5cf6' }} />
              </span>
              <p className="font-semibold mb-1 flex items-center gap-2">
                Voice Agent <span className="cq-chip text-faint">Text preview</span>
              </p>
              <p className="text-sm text-muted">Configure voice settings now; full STT/TTS runtime coming soon. Test as text chat below.</p>
            </button>
          </div>
          <button type="button" onClick={cancel} className="cq-btn cq-btn-ghost mt-5">Cancel</button>
        </div>
      )}

      {/* Step 2 — configure the agent */}
      {step === 'form' && (
        <form onSubmit={create} className="cq-card p-6 mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setStep('type')} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-faint">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold flex items-center gap-2">
              {isVoice ? <Mic className="w-4 h-4" style={{ color: '#8b5cf6' }} /> : <MessageSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
              New {isVoice ? 'Voice' : 'Text'} Agent
            </h3>
          </div>

          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Agent name" required data-testid="agent-name" className="cq-input" />
          <textarea value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
            rows={3} placeholder="System prompt / persona" className="cq-input" />

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-faint">
              LLM provider
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="cq-input mt-1">
                {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="text-xs text-faint">
              Model
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model" className="cq-input mt-1" />
            </label>
            <label className="text-xs text-faint sm:col-span-2">
              API credential (optional)
              <select value={form.credential_id ?? ''} onChange={(e) => setForm({ ...form, credential_id: e.target.value ? Number(e.target.value) : null })} className="cq-input mt-1">
                <option value="">Platform default</option>
                {credentials.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </label>
          </div>

          {isVoice && (
            <div className="rounded-xl border border-token p-4 space-y-3" style={{ background: 'var(--surface-2)' }}>
              <p className="text-sm font-medium flex items-center gap-2">
                <Volume2 className="w-4 h-4" style={{ color: '#8b5cf6' }} /> Voice settings
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs text-faint">
                  Text-to-speech (TTS)
                  <select value={form.tts_provider} onChange={(e) => setForm({ ...form, tts_provider: e.target.value })} className="cq-input mt-1">
                    {TTS_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label className="text-xs text-faint">
                  Voice
                  <input value={form.voice_id} onChange={(e) => setForm({ ...form, voice_id: e.target.value })}
                    placeholder="e.g. Rachel / voice id" className="cq-input mt-1" />
                </label>
                <label className="text-xs text-faint">
                  Speech-to-text (STT)
                  <select value={form.stt_provider} onChange={(e) => setForm({ ...form, stt_provider: e.target.value })} className="cq-input mt-1">
                    {STT_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label className="text-xs text-faint">
                  Language
                  <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="cq-input mt-1">
                    {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="text-xs text-faint block">
                Greeting (spoken first)
                <input value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })}
                  placeholder="Hi! How can I help you today?" className="cq-input mt-1" />
              </label>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" data-testid="agent-create-submit" className="cq-btn cq-btn-primary">Create {isVoice ? 'voice' : 'text'} agent</button>
            <button type="button" onClick={cancel} className="cq-btn cq-btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          {agents.map((a) => {
            const type = agentType(a)
            const voice = type === 'voice'
            return (
              <button key={a.id} onClick={() => selectAgent(a)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${active?.id === a.id ? 'border-[var(--primary)] neon-ring' : 'border-token cq-card-hover'} cq-card`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: voice ? 'color-mix(in srgb, #8b5cf6 16%, transparent)' : 'var(--primary-soft)' }}>
                      {voice ? <Mic className="w-4 h-4" style={{ color: '#8b5cf6' }} /> : <Bot className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
                    </div>
                    <span className="font-medium truncate">{a.name}</span>
                  </div>
                  <Trash2 onClick={(e) => { e.stopPropagation(); remove(a.id) }} className="w-4 h-4 text-faint hover:text-red-500 shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="cq-chip">{voice ? <><AudioLines className="w-3 h-3" /> Voice</> : <><MessageSquare className="w-3 h-3" /> Text</>}</span>
                  {a.published && <span className="cq-chip text-emerald-500">Published</span>}
                  <span className="text-xs text-faint truncate">{a.provider} · {a.model}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(a) }} className="text-xs text-faint hover:text-[var(--ink)] flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); publish(a.id) }} className="text-xs text-faint hover:text-[var(--ink)] flex items-center gap-1"><Globe className="w-3 h-3" /> Publish</button>
                </div>
              </button>
            )
          })}
          {agents.length === 0 && <p className="text-sm text-muted p-4">No agents yet</p>}
        </div>

        <div className="lg:col-span-2 cq-card flex flex-col h-[60vh]">
          {editing ? (
            <form onSubmit={saveEdit} className="p-4 space-y-3 overflow-y-auto">
              <h3 className="font-semibold flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit agent</h3>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="cq-input" required />
              <textarea value={editing.system_prompt} onChange={(e) => setEditing({ ...editing, system_prompt: e.target.value })} rows={4} className="cq-input" />
              <div className="grid grid-cols-2 gap-2">
                <select value={editing.provider} onChange={(e) => setEditing({ ...editing, provider: e.target.value })} className="cq-input">
                  {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input value={editing.model} onChange={(e) => setEditing({ ...editing, model: e.target.value })} className="cq-input" />
              </div>
              <select value={editing.credential_id ?? ''} onChange={(e) => setEditing({ ...editing, credential_id: e.target.value ? Number(e.target.value) : null })} className="cq-input">
                <option value="">Platform default credential</option>
                {credentials.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="cq-btn cq-btn-primary">Save</button>
                <button type="button" onClick={() => setEditing(null)} className="cq-btn cq-btn-ghost">Cancel</button>
              </div>
            </form>
          ) : active ? (
            <>
              <div className="p-4 border-b border-token flex items-center gap-2 flex-wrap">
                {agentType(active) === 'voice'
                  ? <Mic className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                  : <Settings className="w-4 h-4 text-faint" />}
                <span className="font-medium">{active.name}</span>
                <span className="text-xs text-faint">{active.provider} · {active.model}</span>
                <div className="ml-auto flex gap-1">
                  <button type="button" onClick={() => openEdit(active)} className="cq-btn cq-btn-ghost !px-2 !py-1 !text-xs"><Pencil className="w-3 h-3" /> Edit</button>
                  <button type="button" data-testid="agent-publish" onClick={() => publish(active.id)} className="cq-btn cq-btn-ghost !px-2 !py-1 !text-xs"><Globe className="w-3 h-3" /> {active.published ? 'Republish' : 'Publish'}</button>
                </div>
              </div>

              {agentType(active) === 'voice' && (
                <div className="px-4 py-2 text-xs text-faint border-b border-token flex items-center gap-2"
                  style={{ background: 'var(--surface-2)' }}>
                  <AudioLines className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                  Voice settings saved — test conversation as text below (full audio runtime coming soon).
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'text-white' : 'cq-surface-2'}`}
                      style={m.role === 'user' ? { backgroundImage: 'var(--grad-brand)' } : undefined}>{m.content}</div>
                  </div>
                ))}
                {busy && <p className="text-sm text-faint">Thinking…</p>}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t border-token flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                  data-testid="agent-chat-input"
                  placeholder={agentType(active) === 'voice' ? 'Type to test your voice agent…' : 'Message your agent…'} className="cq-input flex-1" />
                <button onClick={send} disabled={busy} data-testid="agent-chat-send" className="cq-btn cq-btn-primary !px-4"><Send className="w-4 h-4" /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-faint">Select an agent to start chatting</div>
          )}
        </div>
      </div>

      {embedInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEmbedInfo(null)}>
          <div className="cq-card max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Published agent embed</h3>
            <p className="text-sm text-muted mb-3">Share this URL or iframe:</p>
            <code className="block text-xs p-3 rounded-xl cq-surface-2 break-all mb-3">
              {window.location.origin}{embedInfo.embed_url}
            </code>
            <button type="button" className="cq-btn cq-btn-ghost text-sm"
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}${embedInfo.embed_url}`)}>
              <Copy className="w-4 h-4" /> Copy embed URL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
