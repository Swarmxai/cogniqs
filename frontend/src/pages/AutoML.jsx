import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wand2, Database, Settings2, Rocket, ChevronRight, ChevronLeft,
  Loader2, Award, BarChart3, CheckCircle2,
} from 'lucide-react'
import { api } from '../api/client'

const STEPS = [
  { id: 'dataset', label: 'Dataset', icon: Database },
  { id: 'configure', label: 'Configure', icon: Settings2 },
  { id: 'train', label: 'Train', icon: Rocket },
]

export default function AutoML() {
  const [step, setStep] = useState(0)
  const [datasets, setDatasets] = useState([])
  const [options, setOptions] = useState(null)
  const [hyperparams, setHyperparams] = useState(null)
  const [schema, setSchema] = useState(null)
  const [error, setError] = useState('')
  const [training, setTraining] = useState(false)
  const [result, setResult] = useState(null)

  const [form, setForm] = useState({
    dataset_id: '',
    model_name: '',
    problem_type: 'binary',
    target_column: '',
    presets: 'medium_quality',
    time_limit: 300,
    eval_metric: '',
    timestamp_column: '',
    item_id_column: '',
    prediction_length: 1,
  })

  useEffect(() => {
    Promise.all([api.getDatasets(), api.getAutoMLOptions(), api.getHyperparameters()])
      .then(([ds, opts, hp]) => {
        setDatasets(ds)
        setOptions(opts)
        setHyperparams(hp)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!form.dataset_id) {
      setSchema(null)
      return
    }
    api.datasetSchema(form.dataset_id)
      .then(setSchema)
      .catch(() => setSchema(null))
  }, [form.dataset_id])

  const columns = schema?.columns?.map((c) => c.name) || []
  const selectedDataset = datasets.find((d) => String(d.id) === String(form.dataset_id))

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const canNext = () => {
    if (step === 0) return !!form.dataset_id
    if (step === 1) {
      if (!form.model_name.trim() || !form.target_column) return false
      if (form.problem_type === 'timeseries') {
        return !!form.timestamp_column && !!form.item_id_column
      }
      return true
    }
    return true
  }

  const train = async () => {
    setTraining(true)
    setError('')
    setResult(null)
    try {
      const payload = {
        dataset_id: Number(form.dataset_id),
        model_name: form.model_name.trim(),
        problem_type: form.problem_type,
        target_column: form.target_column,
        presets: form.presets,
        time_limit: Number(form.time_limit),
        eval_metric: form.eval_metric || null,
        timestamp_column: form.timestamp_column || null,
        item_id_column: form.item_id_column || null,
        prediction_length: Number(form.prediction_length) || 1,
      }
      const res = await api.trainAutoML(payload)
      setResult(res)
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setTraining(false)
    }
  }

  const reset = () => {
    setStep(0)
    setResult(null)
    setError('')
    setForm({
      dataset_id: '',
      model_name: '',
      problem_type: 'binary',
      target_column: '',
      presets: 'medium_quality',
      time_limit: 300,
      eval_metric: '',
      timestamp_column: '',
      item_id_column: '',
      prediction_length: 1,
    })
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-8 animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center neon-ring"
            style={{ backgroundImage: 'var(--grad-brand)' }}>
            <Wand2 className="w-5 h-5 text-white" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auto ML</h1>
            <p className="text-muted text-sm">Train production-ready models from your datasets — no workflow required</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const active = i === step
          const done = i < step || (i === 2 && result)
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium flex-1 ${
                active ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--ink)]'
                  : done ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    : 'border-token text-muted cq-surface-2'
              }`}>
                {done && !active ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Icon className="w-4 h-4 shrink-0" />}
                <span className="truncate">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-faint shrink-0" />}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm border"
          style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div className="cq-card p-6 lg:p-8">
        {/* Step 1 — Dataset */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Select a dataset</h2>
            <p className="text-sm text-muted mb-5">Choose the table you want to train on. Upload new data from the Datasets page.</p>
            {datasets.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No datasets yet.</p>
                <Link to="/datasets" className="cq-btn cq-btn-primary mt-4 inline-flex">Upload dataset</Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {datasets.map((d) => {
                  const selected = String(d.id) === String(form.dataset_id)
                  const rows = d.dataset_metadata?.summary?.row_count
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        set('dataset_id', d.id)
                        if (!form.model_name) set('model_name', `${d.name.replace(/\s+/g, '_').toLowerCase()}_model`)
                        if (d.target_column) set('target_column', d.target_column)
                      }}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        selected
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)] ring-2 ring-[var(--ring)]'
                          : 'border-token hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="font-semibold truncate">{d.name}</div>
                      <div className="text-xs text-muted mt-1">{d.file_name}</div>
                      {rows != null && <div className="text-xs text-faint mt-2">{rows.toLocaleString()} rows</div>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Configure */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold mb-1">Configure training</h2>
              <p className="text-sm text-muted">
                Dataset: <b>{selectedDataset?.name}</b>
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium">Model name</span>
                <input className="cq-input mt-1 w-full" value={form.model_name}
                  onChange={(e) => set('model_name', e.target.value)} placeholder="e.g. churn_predictor" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Problem type</span>
                <select className="cq-input mt-1 w-full" value={form.problem_type}
                  onChange={(e) => set('problem_type', e.target.value)}>
                  {(options?.problem_types || []).map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium">Target column</span>
                <select className="cq-input mt-1 w-full" value={form.target_column}
                  onChange={(e) => set('target_column', e.target.value)}>
                  <option value="">Select column…</option>
                  {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Quality preset</span>
                <select className="cq-input mt-1 w-full" value={form.presets}
                  onChange={(e) => set('presets', e.target.value)}>
                  {(options?.presets || []).map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Time limit (seconds)</span>
                <input type="number" className="cq-input mt-1 w-full" min={30} max={86400}
                  value={form.time_limit} onChange={(e) => set('time_limit', e.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium">Eval metric <span className="text-faint">(optional)</span></span>
                <input className="cq-input mt-1 w-full" value={form.eval_metric}
                  onChange={(e) => set('eval_metric', e.target.value)} placeholder="Leave empty for default" />
              </label>
            </div>

            {form.problem_type === 'timeseries' && (
              <div className="grid sm:grid-cols-3 gap-4 p-4 rounded-xl cq-surface-2 border border-token">
                <label className="block">
                  <span className="text-sm font-medium">Timestamp column</span>
                  <select className="cq-input mt-1 w-full" value={form.timestamp_column}
                    onChange={(e) => set('timestamp_column', e.target.value)}>
                    <option value="">Select…</option>
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Item ID column</span>
                  <select className="cq-input mt-1 w-full" value={form.item_id_column}
                    onChange={(e) => set('item_id_column', e.target.value)}>
                    <option value="">Select…</option>
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Forecast horizon</span>
                  <input type="number" min={1} className="cq-input mt-1 w-full"
                    value={form.prediction_length} onChange={(e) => set('prediction_length', e.target.value)} />
                </label>
              </div>
            )}

            {hyperparams?.models && (
              <div className="p-4 rounded-xl border border-token cq-surface-2">
                <p className="text-sm font-medium mb-2">Algorithms AutoGluon will try</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(hyperparams.models).map(([key, m]) => (
                    <span key={key} className="cq-chip" title={m.desc}>{m.label || key}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Train / Results */}
        {step === 2 && (
          <div>
            {!result && !training && (
              <div className="text-center py-8">
                <Rocket className="w-12 h-12 mx-auto mb-4 text-[var(--primary)] opacity-80" />
                <h2 className="text-lg font-semibold mb-2">Ready to train</h2>
                <p className="text-sm text-muted mb-6">
                  AutoGluon will explore multiple algorithms and pick the best performer for <b>{form.model_name}</b>.
                </p>
                <button type="button" onClick={train} className="cq-btn cq-btn-primary">
                  <Wand2 className="w-4 h-4" /> Start training
                </button>
              </div>
            )}

            {training && (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-[var(--primary)]" />
                <h2 className="text-lg font-semibold">Training in progress…</h2>
                <p className="text-sm text-muted mt-2">This may take a few minutes depending on your time limit.</p>
              </div>
            )}

            {result && (
              <div>
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  <div>
                    <h2 className="font-semibold text-emerald-600">Model trained successfully</h2>
                    <p className="text-sm text-muted">
                      <Award className="w-3 h-3 inline mr-1" />
                      Best: {result.training?.best_model}
                      {result.training?.model_size_mb != null && ` · ${result.training.model_size_mb.toFixed(1)} MB`}
                    </p>
                  </div>
                </div>

                {result.training?.leaderboard?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Leaderboard (top models)
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-token">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="cq-surface-2 text-left text-xs text-muted">
                            <th className="px-3 py-2">Model</th>
                            <th className="px-3 py-2">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.training.leaderboard.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t border-token">
                              <td className="px-3 py-2 font-mono text-xs">{row.model || row.Model || '—'}</td>
                              <td className="px-3 py-2 text-muted">
                                {row.score_val ?? row.score ?? row['score_test'] ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Link to="/models" className="cq-btn cq-btn-primary">
                    View in Model Library
                  </Link>
                  <button type="button" onClick={reset} className="cq-btn cq-btn-ghost">
                    Train another model
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 2 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-token">
            <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 0}
              className="cq-btn cq-btn-ghost disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {step === 1 ? (
              <button type="button" onClick={train} disabled={!canNext() || training}
                className="cq-btn cq-btn-primary">
                {training ? <><Loader2 className="w-4 h-4 animate-spin" /> Training…</> : <><Rocket className="w-4 h-4" /> Train model</>}
              </button>
            ) : (
              <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
                className="cq-btn cq-btn-primary">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
