import { useState } from 'react'
import {
  Layers,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  X,
} from 'lucide-react'
import './ocr-viewer.css'

export default function OCRBoundingBoxViewer({ output }) {
  const [viewMode, setViewMode] = useState('annotated')
  const [zoom, setZoom] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)

  const { annotated_image_base64, source_image_base64 } = output || {}

  const annotatedSrc = annotated_image_base64
    ? `data:image/png;base64,${annotated_image_base64}`
    : null
  const originalSrc = source_image_base64
    ? `data:image/png;base64,${source_image_base64}`
    : null

  const displaySrc = viewMode === 'original' ? originalSrc : annotatedSrc || originalSrc

  if (!displaySrc) return null

  return (
    <div className="ocr-bbox-viewer">
      <div className="ocr-bbox-toolbar">
        <div className="ocr-bbox-toolbar-left">
          <button
            type="button"
            className={`ocr-bbox-btn ${viewMode === 'annotated' ? 'active' : ''}`}
            onClick={() => setViewMode('annotated')}
          >
            <Layers size={14} /> Annotated
          </button>
          <button
            type="button"
            className={`ocr-bbox-btn ${viewMode === 'original' ? 'active' : ''}`}
            onClick={() => setViewMode('original')}
          >
            <ImageIcon size={14} /> Original
          </button>
        </div>

        <div className="ocr-bbox-toolbar-right">
          <button type="button" className="ocr-bbox-btn" aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}>
            <ZoomOut size={14} />
          </button>
          <span className="ocr-bbox-zoom-label">{Math.round(zoom * 100)}%</span>
          <button type="button" className="ocr-bbox-btn" aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}>
            <ZoomIn size={14} />
          </button>
          <button type="button" className="ocr-bbox-btn" aria-label="Reset zoom"
            onClick={() => setZoom(1)}>
            <RotateCcw size={14} />
          </button>
          <button type="button" className="ocr-bbox-btn" aria-label="Fullscreen"
            onClick={() => setFullscreen(true)}>
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      <div className="ocr-bbox-body">
        <div className="ocr-bbox-image-panel">
          <div
            className="ocr-bbox-image-wrapper"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            <img src={displaySrc} alt="OCR result" className="ocr-bbox-image" />
          </div>
        </div>
      </div>

      {fullscreen && (
        <div className="ocr-bbox-fullscreen" onClick={() => setFullscreen(false)}>
          <div className="ocr-bbox-fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ocr-bbox-fullscreen-close" aria-label="Close fullscreen"
              onClick={() => setFullscreen(false)}>
              <X size={16} />
            </button>
            <img src={displaySrc} alt="OCR fullscreen" />
          </div>
        </div>
      )}
    </div>
  )
}
