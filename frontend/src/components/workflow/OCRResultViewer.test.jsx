import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OCRResultViewer from './OCRResultViewer'

// 1x1 transparent PNG
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const output = {
  text: 'Hello world',
  line_count: 2,
  average_confidence: 0.97,
  annotated_image_base64: TINY_PNG,
  source_image_base64: TINY_PNG,
  _display: { type: 'ocr_bbox_viewer' },
}

describe('OCRResultViewer', () => {
  it('renders preview tab with annotated image and meta', () => {
    render(<OCRResultViewer output={output} />)
    expect(screen.getByAltText('OCR result')).toBeTruthy()
    expect(screen.getByText('2 lines · 97% confidence')).toBeTruthy()
  })

  it('switches to text tab and shows extracted text', () => {
    render(<OCRResultViewer output={output} />)
    fireEvent.click(screen.getByRole('button', { name: /text/i }))
    expect(screen.getByText('Hello world')).toBeTruthy()
  })

  it('switches to JSON tab and shows raw output', () => {
    render(<OCRResultViewer output={output} />)
    fireEvent.click(screen.getByRole('button', { name: /json/i }))
    expect(screen.getByText(/"line_count": 2/)).toBeTruthy()
  })

  it('toggles between annotated and original view modes', () => {
    render(<OCRResultViewer output={output} />)
    const originalBtn = screen.getByRole('button', { name: /original/i })
    fireEvent.click(originalBtn)
    expect(originalBtn.className).toContain('active')
  })
})
