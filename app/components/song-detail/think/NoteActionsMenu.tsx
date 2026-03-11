'use client'

import type { Note } from './types'

type NoteActionsMenuProps = {
  note: Note
  isOpen: boolean
  onToggle: (noteId: string) => void
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
}

export default function NoteActionsMenu({
  note,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
}: NoteActionsMenuProps) {
  return (
    <div className="menu-container" onClick={event => event.stopPropagation()}>
      <button
        type="button"
        className="button-ghost menu-trigger"
        onClick={event => {
          event.stopPropagation()
          onToggle(note.id)
        }}
      >
        <span className="menu-dots" aria-hidden="true">⋯</span>
        <span className="sr-only">Note actions</span>
      </button>
      {isOpen && (
        <div className="menu" onClick={event => event.stopPropagation()}>
          <button
            type="button"
            className="menu-item"
            onClick={() => onEdit(note)}
          >
            Edit
          </button>
          <button
            type="button"
            className="menu-item menu-danger"
            onClick={() => onDelete(note.id)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
