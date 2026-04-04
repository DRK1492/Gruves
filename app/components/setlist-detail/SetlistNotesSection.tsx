'use client'

import NoteContent from '../NoteContent'
import NoteEditor from '../NoteEditor'
import type { SetlistNote } from './types'

type SetlistNotesSectionProps = {
  editingNoteContent: string
  editingNoteId: string | null
  newNote: string
  notes: SetlistNote[]
  onAddNote: () => void
  onDeleteNote: (noteId: string) => void
  onEditNote: (note: SetlistNote) => void
  onUpdateNote: () => void
  openNoteMenuId: string | null
  setEditingNoteContent: (value: string) => void
  setEditingNoteId: (value: string | null) => void
  setNewNote: (value: string) => void
  setOpenNoteMenuId: (updater: (prev: string | null) => string | null) => void
}

export default function SetlistNotesSection({
  editingNoteContent,
  editingNoteId,
  newNote,
  notes,
  onAddNote,
  onDeleteNote,
  onEditNote,
  onUpdateNote,
  openNoteMenuId,
  setEditingNoteContent,
  setEditingNoteId,
  setNewNote,
  setOpenNoteMenuId,
}: SetlistNotesSectionProps) {
  return (
    <div className="card p-6 mt-6">
      <p className="label mb-3">Setlist Notes</p>
      <div className="section-divider" />
      <NoteEditor
        value={newNote}
        onChange={setNewNote}
        placeholder="Add a note about this setlist..."
        className="input note-editor w-full mb-3 min-h-[100px]"
      />
      <div className="flex justify-end mb-6">
        <button onClick={onAddNote} className="button-primary button-cta">
          Save Note
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="muted">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map(note => (
            <li
              key={note.id}
              className={`row flex justify-between items-start ${openNoteMenuId === note.id ? 'row-menu-open' : ''}`}
            >
              {editingNoteId === note.id ? (
                <div className="w-full">
                  <NoteEditor
                    value={editingNoteContent}
                    onChange={setEditingNoteContent}
                    placeholder="Edit note..."
                    className="input note-editor w-full mb-2 min-h-[100px]"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={onUpdateNote}
                      className="button-primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingNoteId(null)
                        setEditingNoteContent('')
                      }}
                      className="button-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="note-content flex-1">
                    <NoteContent text={note.content} />
                  </div>
                  <div className="menu-container" onClick={event => event.stopPropagation()}>
                    <button
                      type="button"
                      className="button-ghost menu-trigger"
                      onClick={event => {
                        event.stopPropagation()
                        setOpenNoteMenuId(prev => (prev === note.id ? null : note.id))
                      }}
                    >
                      <span className="menu-dots" aria-hidden="true">⋯</span>
                      <span className="sr-only">Note actions</span>
                    </button>
                    {openNoteMenuId === note.id && (
                      <div className="menu" onClick={event => event.stopPropagation()}>
                        <button
                          type="button"
                          className="menu-item"
                          onClick={() => {
                            onEditNote(note)
                            setOpenNoteMenuId(() => null)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="menu-item menu-danger"
                          onClick={() => {
                            onDeleteNote(note.id)
                            setOpenNoteMenuId(() => null)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
