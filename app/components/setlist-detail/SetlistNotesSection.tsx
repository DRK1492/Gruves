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
  setEditingNoteContent: (value: string) => void
  setEditingNoteId: (value: string | null) => void
  setNewNote: (value: string) => void
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
  setEditingNoteContent,
  setEditingNoteId,
  setNewNote,
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
      <div className="flex gap-2 mb-6">
        <button onClick={onAddNote} className="button-primary" style={{ padding: '0.28rem 0.7rem', fontSize: '0.8rem' }}>
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
              className="row flex justify-between items-start"
            >
              {editingNoteId === note.id ? (
                <div
                  className="w-full"
                  onBlur={e => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setEditingNoteId(null)
                      setEditingNoteContent('')
                    }
                  }}
                >
                  <NoteEditor
                    value={editingNoteContent}
                    onChange={setEditingNoteContent}
                    placeholder="Edit note..."
                    className="input note-editor w-full mb-2 min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onUpdateNote}
                      className="button-primary"
                      style={{ padding: '0.28rem 0.7rem', fontSize: '0.8rem' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingNoteId(null)
                        setEditingNoteContent('')
                      }}
                      className="button-ghost"
                      style={{ padding: '0.28rem 0.6rem', fontSize: '0.8rem' }}
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
                  <div className="think-note-actions" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="listen-link-action-btn"
                      title="Edit"
                      onClick={() => onEditNote(note)}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                        <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61z" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="listen-link-action-btn listen-link-action-danger"
                      title="Delete"
                      onClick={() => onDeleteNote(note.id)}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                        <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19a1.75 1.75 0 001.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225H5.405a.25.25 0 01-.249-.225l-.66-6.6z" strokeLinejoin="round"/>
                      </svg>
                    </button>
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
