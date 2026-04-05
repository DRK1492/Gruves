'use client'

const htmlRegex = /<\/?[a-z][\s\S]*>/i

const stripHtml = (html: string): string => {
  if (!htmlRegex.test(html)) return html
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '').trim()
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? ''
}

export default function NoteEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <textarea
      value={stripHtml(value)}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  )
}
