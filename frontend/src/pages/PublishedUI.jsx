import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { WidgetView } from '../components/uibuilder/widgets'

export default function PublishedUI() {
  const { publicId } = useParams()
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPublicUI(publicId).then(setProject).catch((e) => setError(e.message))
  }, [publicId])

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
        {(project.components || []).map((w) => (
          <div key={w.id}><WidgetView widget={w} /></div>
        ))}
      </div>
    </div>
  )
}
