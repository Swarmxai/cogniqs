import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Bot, Send } from 'lucide-react'
import { api } from '../api/client'

export default function EmbedAgent() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || !token) return
    const msg = input
    setMessages((m) => [...m, { role: 'user', content: msg }])
    setInput(''); setBusy(true)
    try {
      const res = await api.chatAgentPublic(id, msg, token)
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="px-4 py-3 border-b border-token flex items-center gap-2">
        <Bot className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        <span className="font-semibold">Cogniqs Agent</span>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
        {messages.length === 0 && <p className="text-center text-muted text-sm py-8">Send a message to start</p>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'text-white' : 'cq-surface-2 border border-token'}`}
              style={m.role === 'user' ? { backgroundImage: 'var(--grad-brand)' } : undefined}>{m.content}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-4 border-t border-token max-w-2xl mx-auto w-full flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Message…" className="cq-input flex-1" disabled={!token} />
        <button onClick={send} disabled={busy || !token} className="cq-btn cq-btn-primary !px-4"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  )
}
