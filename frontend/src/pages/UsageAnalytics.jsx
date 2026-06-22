import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Hash, Activity } from 'lucide-react'
import { api } from '../api/client'

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="cq-card cq-card-hover p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}

export default function UsageAnalytics() {
  const [summary, setSummary] = useState({ total_tokens: 0, total_cost: 0, call_count: 0 })
  const [models, setModels] = useState([])
  const [daily, setDaily] = useState([])

  useEffect(() => {
    api.usageSummary().then(setSummary).catch(console.error)
    api.usageByModel().then(setModels).catch(console.error)
    api.usageDaily().then(setDaily).catch(console.error)
  }, [])

  const maxTokens = Math.max(1, ...daily.map((d) => d.tokens))

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <h1 className="text-3xl font-bold tracking-tight mb-1">Usage Analytics</h1>
      <p className="text-muted mb-7">LLM token consumption and cost over the last 30 days</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat icon={Hash} label="Total Tokens" value={summary.total_tokens.toLocaleString()} color="#6366f1" />
        <Stat icon={DollarSign} label="Estimated Cost" value={`$${summary.total_cost.toFixed(2)}`} color="#10b981" />
        <Stat icon={Activity} label="LLM Calls" value={summary.call_count.toLocaleString()} color="#f59e0b" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="cq-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Daily Tokens</h3>
          <div className="flex items-end gap-1 h-40">
            {daily.length === 0 && <p className="text-sm text-faint">No usage recorded yet</p>}
            {daily.map((d) => (
              <div key={d.date} className="flex-1 group relative" title={`${d.date}: ${d.tokens} tokens`}>
                <div className="rounded-t transition-all hover:opacity-80" style={{ height: `${(d.tokens / maxTokens) * 100}%`, backgroundImage: 'var(--grad-brand)' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="cq-card p-6">
          <h3 className="font-semibold mb-4">By Model</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-faint border-b border-token">
              <th className="py-2">Model</th><th className="py-2">Tokens</th><th className="py-2">Cost</th>
            </tr></thead>
            <tbody>
              {models.map((m, i) => (
                <tr key={i} className="border-b border-token">
                  <td className="py-2">{m.provider}/{m.model}</td>
                  <td className="py-2 font-mono">{m.tokens.toLocaleString()}</td>
                  <td className="py-2 font-mono">${m.cost.toFixed(3)}</td>
                </tr>
              ))}
              {models.length === 0 && <tr><td colSpan={3} className="py-4 text-faint">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
