import { useState } from 'react'
import { ScanText, FileText, Braces } from 'lucide-react'
import OCRBoundingBoxViewer from './OCRBoundingBoxViewer'
import './ocr-viewer.css'

export default function OCRResultViewer({ output }) {
  const [tab, setTab] = useState('preview')

  const text = output?.text || ''
  const confidence = output?.average_confidence
  const lineCount = output?.line_count

  return (
    <div className="ocr-result-viewer">
      <div className="ocr-result-viewer-tabs">
        <button
          type="button"
          className={`ocr-result-viewer-tab ${tab === 'preview' ? 'active' : ''}`}
          onClick={() => setTab('preview')}
        >
          <ScanText size={13} /> Preview
        </button>
        <button
          type="button"
          className={`ocr-result-viewer-tab ${tab === 'text' ? 'active' : ''}`}
          onClick={() => setTab('text')}
        >
          <FileText size={13} /> Text
        </button>
        <button
          type="button"
          className={`ocr-result-viewer-tab ${tab === 'json' ? 'active' : ''}`}
          onClick={() => setTab('json')}
        >
          <Braces size={13} /> JSON
        </button>

        {(lineCount != null || confidence != null) && (
          <span className="ocr-result-viewer-meta">
            {lineCount != null && `${lineCount} lines`}
            {lineCount != null && confidence != null && ' · '}
            {confidence != null && `${Math.round(confidence * 100)}% confidence`}
          </span>
        )}
      </div>

      {tab === 'preview' && <OCRBoundingBoxViewer output={output} />}
      {tab === 'text' && (
        <pre className="ocr-result-text">{text || 'No text extracted.'}</pre>
      )}
      {tab === 'json' && (
        <pre className="ndv-io-pre">{JSON.stringify(output, null, 2)}</pre>
      )}
    </div>
  )
}
