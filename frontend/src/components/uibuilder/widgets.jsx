import { Type, Heading, Square, Image, TextCursorInput, Minus, MousePointerClick, ClipboardList } from 'lucide-react'

// Widget catalog — each widget has a type, default props, and prop schema
export const WIDGETS = {
  heading: {
    label: 'Heading', icon: Heading,
    defaults: { text: 'Heading', level: 'h1', align: 'left', color: '#1c1917' },
    props: [
      { name: 'text', type: 'text', label: 'Text' },
      { name: 'level', type: 'select', label: 'Level', options: ['h1', 'h2', 'h3'] },
      { name: 'align', type: 'select', label: 'Align', options: ['left', 'center', 'right'] },
      { name: 'color', type: 'color', label: 'Color' },
    ],
  },
  text: {
    label: 'Text', icon: Type,
    defaults: { text: 'Some paragraph text.', align: 'left', color: '#44403c', size: 16 },
    props: [
      { name: 'text', type: 'textarea', label: 'Text' },
      { name: 'align', type: 'select', label: 'Align', options: ['left', 'center', 'right'] },
      { name: 'size', type: 'number', label: 'Font size' },
      { name: 'color', type: 'color', label: 'Color' },
    ],
  },
  button: {
    label: 'Button', icon: MousePointerClick,
    defaults: { text: 'Click me', href: '#', bg: '#4f46e5', color: '#ffffff' },
    props: [
      { name: 'text', type: 'text', label: 'Label' },
      { name: 'href', type: 'text', label: 'Link URL' },
      { name: 'bg', type: 'color', label: 'Background' },
      { name: 'color', type: 'color', label: 'Text color' },
    ],
  },
  image: {
    label: 'Image', icon: Image,
    defaults: { src: 'https://placehold.co/600x300', alt: 'image', radius: 12 },
    props: [
      { name: 'src', type: 'text', label: 'Image URL' },
      { name: 'alt', type: 'text', label: 'Alt text' },
      { name: 'radius', type: 'number', label: 'Corner radius' },
    ],
  },
  input: {
    label: 'Input', icon: TextCursorInput,
    defaults: { placeholder: 'Enter text…', label: 'Field' },
    props: [
      { name: 'label', type: 'text', label: 'Label' },
      { name: 'placeholder', type: 'text', label: 'Placeholder' },
    ],
  },
  divider: {
    label: 'Divider', icon: Minus,
    defaults: { color: '#e7e5e4' },
    props: [{ name: 'color', type: 'color', label: 'Color' }],
  },
  form: {
    label: 'Form', icon: ClipboardList,
    defaults: { title: 'Contact us', submitLabel: 'Submit', webhookUrl: '', fields: 'name,email,message' },
    props: [
      { name: 'title', type: 'text', label: 'Form title' },
      { name: 'submitLabel', type: 'text', label: 'Submit button' },
      { name: 'webhookUrl', type: 'text', label: 'Workflow webhook URL (from editor)' },
      { name: 'fields', type: 'text', label: 'Fields (comma-separated)' },
    ],
  },
  container: {
    label: 'Spacer/Box', icon: Square,
    defaults: { height: 40, bg: 'transparent' },
    props: [
      { name: 'height', type: 'number', label: 'Height (px)' },
      { name: 'bg', type: 'color', label: 'Background' },
    ],
  },
}

export function newWidget(type) {
  return {
    id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    props: { ...WIDGETS[type].defaults },
  }
}

export function WidgetView({ widget, onFormSubmit }) {
  const { type, props } = widget
  if (type === 'heading') {
    const Tag = props.level || 'h1'
    const sizes = { h1: 'text-3xl', h2: 'text-2xl', h3: 'text-xl' }
    return <Tag className={`font-bold ${sizes[props.level] || 'text-3xl'}`} style={{ textAlign: props.align, color: props.color }}>{props.text}</Tag>
  }
  if (type === 'text') {
    return <p style={{ textAlign: props.align, color: props.color, fontSize: props.size }}>{props.text}</p>
  }
  if (type === 'button') {
    return <a href={props.href} className="inline-block px-5 py-2.5 rounded-xl font-medium" style={{ background: props.bg, color: props.color }}>{props.text}</a>
  }
  if (type === 'image') {
    return <img src={props.src} alt={props.alt} style={{ borderRadius: props.radius, maxWidth: '100%' }} />
  }
  if (type === 'input') {
    return (
      <label className="block">
        <span className="text-sm text-stone-600 dark:text-stone-300">{props.label}</span>
        <input placeholder={props.placeholder} className="mt-1 w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent" />
      </label>
    )
  }
  if (type === 'divider') {
    return <hr style={{ borderColor: props.color }} />
  }
  if (type === 'form') {
    const fieldNames = (props.fields || 'name,email').split(',').map((s) => s.trim()).filter(Boolean)
    return (
      <form
        className="space-y-3 p-4 border border-stone-200 rounded-xl"
        onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const body = Object.fromEntries(fieldNames.map((f) => [f, fd.get(f) || '']))
          if (props.webhookUrl && onFormSubmit) {
            await onFormSubmit(props.webhookUrl, body)
          }
        }}
      >
        {props.title && <h3 className="font-semibold">{props.title}</h3>}
        {fieldNames.map((f) => (
          <label key={f} className="block text-sm">
            <span className="capitalize">{f}</span>
            <input name={f} required className="mt-1 w-full px-3 py-2 rounded-lg border border-stone-300 bg-transparent" />
          </label>
        ))}
        <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm">{props.submitLabel || 'Submit'}</button>
      </form>
    )
  }
  if (type === 'container') {
    return <div style={{ height: props.height, background: props.bg }} />
  }
  return null
}
