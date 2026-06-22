import { useState } from 'react'
import { Play, X, MessageSquare } from 'lucide-react'
import AnalysisResultRenderer from './AnalysisResultRenderer'

function collectMlOutputs(result) {
  const outputs = result?.result?.nodeOutputs || result?.nodeOutputs || {}
  return Object.values(outputs)
    .map((n) => n?.outputData)
    .filter((o) => o && o.output_type)
}

export default function ExecutePanel({ onExecute, onClose, onChat, showChat }) {
  const [message, setMessage] = useState('Hello!')
  const [document, setDocument] = useState('')
  const [collection, setCollection] = useState('default')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const run = async (data) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await onExecute(data)
      setResult(res)
    } catch (err) {
      setResult({ status: 'error', error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute bottom-4 right-4 w-96 rounded-2xl bg-[var(--color-surface-elevated)] border border-stone-200 dark:border-stone-800 shadow-xl z-20 animate-fade-up">
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Play className="w-4 h-4 text-indigo-600" /> Execute Workflow
        </h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-stone-500 mb-1 block">Message</label>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500 mb-1 block">Collection (RAG)</label>
          <input
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500 mb-1 block">Document Text</label>
          <textarea
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            rows={3}
            placeholder="Optional document for RAG ingest…"
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent resize-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => run({ message, session_id: 'test', collection_name: collection, document })}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Running…' : 'Run'}
          </button>
          {showChat && onChat && (
            <button
              onClick={() => onChat(message)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-900"
              title="Chat mode"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
        </div>
        {result && collectMlOutputs(result).map((output, i) => (
          <div key={i} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <AnalysisResultRenderer output={output} />
          </div>
        ))}
        {result && (
          <div className={`p-3 rounded-xl text-xs font-mono max-h-40 overflow-auto ${
            result.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200' :
            'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
          }`}>
            <pre className="whitespace-pre-wrap">{JSON.stringify(result.result?.finalOutput || result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
