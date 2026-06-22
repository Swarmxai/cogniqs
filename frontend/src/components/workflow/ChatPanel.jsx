import { useEffect, useRef, useState } from 'react'
import { Send, X, Bot, User } from 'lucide-react'
import { api } from '../../api/client'

export default function ChatPanel({ workflowId, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [sessionId] = useState(() => `sess_${Date.now()}`)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/chat/${workflowId}?token=${api.token}&session_id=${sessionId}`
    )
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'token') {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.streaming) {
            return [...prev.slice(0, -1), { ...last, content: last.content + data.content }]
          }
          return [...prev, { role: 'assistant', content: data.content, streaming: true }]
        })
      } else if (data.type === 'done') {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.streaming) {
            return [...prev.slice(0, -1), { role: 'assistant', content: data.content || last.content }]
          }
          return [...prev, { role: 'assistant', content: data.content }]
        })
        setStreaming(false)
      } else if (data.type === 'error') {
        setMessages((prev) => [...prev, { role: 'error', content: data.content }])
        setStreaming(false)
      }
    }

    ws.onerror = () => setStreaming(false)
    return () => ws.close()
  }, [workflowId, sessionId])

  const send = () => {
    if (!input.trim() || streaming) return
    const msg = input.trim()
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setInput('')
    setStreaming(true)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: msg, session_id: sessionId }))
    } else {
      api.chat(workflowId, msg, sessionId).then((res) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.response }])
        setStreaming(false)
      }).catch((err) => {
        setMessages((prev) => [...prev, { role: 'error', content: err.message }])
        setStreaming(false)
      })
    }
  }

  return (
    <div className="absolute bottom-4 left-4 w-96 h-[480px] rounded-2xl bg-[var(--color-surface-elevated)] border border-stone-200 dark:border-stone-800 shadow-xl z-20 flex flex-col animate-fade-up">
      <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Bot className="w-4 h-4 text-indigo-600" /> Live Chat
        </h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-8">Send a message to test your workflow</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role !== 'user' && <Bot className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />}
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
              m.role === 'user' ? 'bg-indigo-600 text-white' :
              m.role === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-950' :
              'bg-stone-100 dark:bg-stone-800'
            }`}>
              {m.content}
              {m.streaming && <span className="inline-block w-1 h-4 bg-indigo-400 ml-0.5 animate-pulse" />}
            </div>
            {m.role === 'user' && <User className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5" />}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          disabled={streaming}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          className="p-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
