import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export default function WorkflowBuilder({ onClose }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const generate = async () => {
    if (!description.trim()) return
    setLoading(true)
    try {
      const { workflow } = await api.generateWorkflow(description)
      const created = await api.createWorkflow({
        name: workflow.name || 'AI Generated',
        description: workflow.description || description,
        nodes: workflow.nodes || [],
        connections: workflow.connections || [],
      })
      navigate(`/workflows/${created.id}`)
      onClose?.()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--color-surface-elevated)] border border-stone-200 dark:border-stone-800 shadow-2xl animate-fade-up">
        <div className="p-6 border-b border-stone-200 dark:border-stone-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> AI Workflow Builder
          </h2>
          <p className="text-sm text-stone-500 mt-1">Describe what you want to build in plain English</p>
        </div>
        <div className="p-6">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="e.g. Create a chat agent with OpenAI that remembers conversation history"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            autoFocus
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              'Chat agent with memory',
              'RAG document Q&A',
              'Basic LLM chain with Claude',
            ].map((hint) => (
              <button
                key={hint}
                onClick={() => setDescription(hint)}
                className="text-xs px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm hover:bg-stone-100 dark:hover:bg-stone-800">
            Cancel
          </button>
          <button
            onClick={generate}
            disabled={loading || !description.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Workflow
          </button>
        </div>
      </div>
    </div>
  )
}
