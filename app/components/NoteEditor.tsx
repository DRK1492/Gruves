'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'

const htmlRegex = /<\/?[a-z][\s\S]*>/i

const normalizePlainText = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('')

const isMeaningful = (html: string) => {
  if (typeof window === 'undefined') return html.trim().length > 0
  const div = document.createElement('div')
  div.innerHTML = html
  return Boolean(div.textContent && div.textContent.trim().length > 0)
}

export default function NoteEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const lastValueRef = useRef<string>('')

  const htmlValue = useMemo(() => {
    if (!value) return ''
    return htmlRegex.test(value) ? value : normalizePlainText(value)
  }, [value])

  useLayoutEffect(() => {
    if (!editorRef.current) return
    if (lastValueRef.current === htmlValue) return
    editorRef.current.innerHTML = htmlValue
    lastValueRef.current = htmlValue
  }, [htmlValue])

  const emitChange = () => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    lastValueRef.current = html
    onChange(html)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      return
    }
  }

  const handleInput = () => {
    emitChange()
  }

  const handleBlur = () => {
    if (!editorRef.current) return
    if (!isMeaningful(editorRef.current.innerHTML)) {
      editorRef.current.innerHTML = ''
      onChange('')
    }
  }

  return (
    <div
      ref={editorRef}
      className={className}
      contentEditable
      data-placeholder={placeholder}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      role="textbox"
      aria-multiline="true"
      suppressContentEditableWarning
    />
  )
}
