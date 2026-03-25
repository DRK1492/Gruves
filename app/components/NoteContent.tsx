'use client'

import { useMemo } from 'react'
import DOMPurify from 'dompurify'

type NoteBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: NoteListItem[] }

type NoteListItem = {
  text: string
  children?: NoteBlock
}

const listItemRegex = /^(\s*)([-*])\s+(.*)$/
const htmlRegex = /<\/?[a-z][\s\S]*>/i

const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u'],
    ALLOWED_ATTR: [],
  })
}

const parseList = (lines: string[], startIndex: number) => {
  const root: { indent: number; items: NoteListItem[] } = { indent: 0, items: [] }
  const stack: Array<{ indent: number; items: NoteListItem[] }> = [root]
  let index = startIndex

  const ensureChildList = (parent: NoteListItem) => {
    const existing = parent.children && parent.children.type === 'list' ? parent.children : null
    if (existing) return existing.items
    const newList: NoteBlock = { type: 'list', items: [] }
    parent.children = newList
    return newList.items
  }

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      break
    }

    const match = line.match(listItemRegex)
    if (!match) break

    const indent = Math.floor(match[1].length / 2)
    const text = match[3].trim()

    while (stack.length > 1 && indent < stack[stack.length - 1].indent) {
      stack.pop()
    }

    if (indent > stack[stack.length - 1].indent) {
      const parentList = stack[stack.length - 1]
      const parentItem = parentList.items[parentList.items.length - 1]
      if (parentItem) {
        const childItems = ensureChildList(parentItem)
        stack.push({ indent, items: childItems })
      }
    }

    if (indent !== stack[stack.length - 1].indent) {
      const targetIndent = stack[stack.length - 1].indent
      while (stack.length > 1 && indent < targetIndent) {
        stack.pop()
      }
    }

    stack[stack.length - 1].items.push({ text })
    index += 1
  }

  return { block: { type: 'list', items: root.items } as NoteBlock, nextIndex: index }
}

const parseNoteContent = (text: string) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: NoteBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    if (listItemRegex.test(line)) {
      const { block, nextIndex } = parseList(lines, index)
      blocks.push(block)
      index = nextIndex
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length && lines[index].trim() && !listItemRegex.test(lines[index])) {
      paragraphLines.push(lines[index])
      index += 1
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n') })
  }

  return blocks
}

const renderBlocks = (blocks: NoteBlock[]) =>
  blocks.map((block, blockIndex) => {
    if (block.type === 'paragraph') {
      const parts = block.text.split('\n')
      return (
        <p key={`p-${blockIndex}`}>
          {parts.map((part, index) => (
            <span key={`p-${blockIndex}-${index}`}>
              {part}
              {index < parts.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      )
    }

    return (
      <ul key={`ul-${blockIndex}`}>
        {block.items.map((item, itemIndex) => (
          <li key={`li-${blockIndex}-${itemIndex}`}>
            {item.text}
            {item.children && item.children.type === 'list' ? renderBlocks([item.children]) : null}
          </li>
        ))}
      </ul>
    )
  })

export default function NoteContent({ text }: { text: string }) {
  const isHtml = htmlRegex.test(text)
  const sanitizedHtml = useMemo(() => (isHtml ? sanitizeHtml(text) : ''), [isHtml, text])
  const blocks = useMemo(() => parseNoteContent(text), [text])

  if (isHtml) {
    return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  }

  return <>{renderBlocks(blocks)}</>
}
