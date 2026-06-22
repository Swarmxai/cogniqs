import { Award, BarChart3, AlertTriangle, TrendingUp, CheckCircle, Cpu } from 'lucide-react'

function MetricGrid({ obj }) {
  const entries = Object.entries(obj || {})
  if (!entries.length) return null
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {entries.map(([k, v]) => (
        <div key={k} className="px-2 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/50">
          <p className="text-[10px] text-stone-400 truncate">{k}</p>
          <p className="text-sm font-mono">{typeof v === 'number' ? v.toFixed(4) : String(v)}</p>
        </div>
      ))}
    </div>
  )
}

export default function AnalysisResultRenderer({ output }) {
  if (!output || typeof output !== 'object') return null
  const type = output.output_type

  if (type === 'model_training_result') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-violet-600"><Cpu className="w-4 h-4" /><b>Training complete</b></div>
        <p className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" /> Best model: <b>{output.best_model}</b></p>
        <p className="text-xs text-stone-500">Model ID {output.model_id} · {output.problem_type} · {output.model_size_mb} MB</p>
        <MetricGrid obj={output.test_metrics} />
        {Array.isArray(output.leaderboard) && output.leaderboard.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-stone-500 mb-1">Leaderboard (top 5)</p>
            <div className="overflow-auto max-h-40 rounded-lg border border-stone-200 dark:border-stone-800">
              <table className="text-xs w-full">
                <thead><tr className="bg-stone-50 dark:bg-stone-800/50 text-left">
                  <th className="px-2 py-1">Model</th><th className="px-2 py-1">Score</th>
                </tr></thead>
                <tbody>
                  {output.leaderboard.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-stone-100 dark:border-stone-800">
                      <td className="px-2 py-1 font-mono">{row.model}</td>
                      <td className="px-2 py-1 font-mono">{(row.score_val ?? row.score_test ?? '').toString().slice(0, 8)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (type === 'eda_report') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-cyan-600"><BarChart3 className="w-4 h-4" /><b>EDA Report</b></div>
        <p className="text-xs text-stone-500">{output.row_count} rows · {output.column_count} columns</p>
        {output.missing_values && Object.keys(output.missing_values).length > 0 && (
          <div><p className="text-xs font-medium text-stone-500">Missing values</p><MetricGrid obj={output.missing_values} /></div>
        )}
      </div>
    )
  }

  if (type === 'clustering_result') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-purple-600"><BarChart3 className="w-4 h-4" /><b>Clustering · {output.algorithm}</b></div>
        <p className="text-xs text-stone-500">{output.n_clusters} clusters</p>
        <MetricGrid obj={output.cluster_distribution} />
      </div>
    )
  }

  if (type === 'anomaly_result') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-4 h-4" /><b>Anomaly Detection</b></div>
        <p className="text-xs text-stone-500">{output.anomaly_count} of {output.total_rows} rows ({(output.anomaly_ratio * 100).toFixed(1)}%)</p>
      </div>
    )
  }

  if (type === 'forecast_result') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-teal-600"><TrendingUp className="w-4 h-4" /><b>Forecast · {output.value_column}</b></div>
        <p className="text-xs font-mono">{output.forecast.map((v) => v.toFixed(2)).join(', ')}</p>
      </div>
    )
  }

  if (type === 'evaluation_result') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-emerald-600"><CheckCircle className="w-4 h-4" /><b>Model Evaluation</b></div>
        <MetricGrid obj={output.metrics} />
      </div>
    )
  }

  if (type === 'deployment_result') {
    return (
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-pink-600"><CheckCircle className="w-4 h-4" /><b>Deployed</b></div>
        <p className="text-xs text-stone-500 break-all">POST {output.predict_url}</p>
        <p className="text-xs font-mono break-all">key: {output.api_key}</p>
      </div>
    )
  }

  if (type === 'inference_result') {
    return (
      <div className="space-y-1 text-sm">
        <b>Predictions ({output.count})</b>
        <pre className="text-xs font-mono overflow-auto max-h-32">{JSON.stringify(output.predictions, null, 2)}</pre>
      </div>
    )
  }

  return null
}
