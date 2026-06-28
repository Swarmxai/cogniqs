import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { WidgetView } from '../components/uibuilder/widgets'

export default function PublishedUI() {
  const { publicId } = useParams()
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')
  const [submitMsg, setSubmitMsg] = useState('')

  useEffect(() => {
    api.getPublicUI(publicId).then(setProject).catch((e) => setError(e.message))
  }, [publicId])

  const onFormSubmit = async (webhookUrl, body) => {
    setSubmitMsg('')
    const url = webhookUrl.startsWith('http') ? webhookUrl : `${window.location.origin}${webhookUrl}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) throw new Error(data.message || 'Submit failed')
    setSubmitMsg('Submitted successfully!')
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-stone-500">{error}</div>
  }
  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        {submitMsg && <p className="text-sm text-emerald-600">{submitMsg}</p>}
        {(project.components || []).map((w) => (
          <div key={w.id}><WidgetView widget={w} onFormSubmit={onFormSubmit} /></div>
        ))}
      </div>
    </div>
  )
}
