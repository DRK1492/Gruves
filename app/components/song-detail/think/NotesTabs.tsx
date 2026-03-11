'use client'

import NoteContent from '../../NoteContent'
import NoteForm from './NoteForm'
import { resetEditingAssociations } from './noteHelpers'
import type { NoteEditSharedProps, Note } from './types'

type NotesTabsProps = NoteEditSharedProps & {
  effectiveActiveNoteTabId: string | null
  getNoteLabel: (note: Note, index: number) => string
  setActiveNoteTabId: (id: string) => void
}

export default function NotesTabs({
  editingNoteContent,
  editingNoteId,
  editingNoteLinkId,
  editingNotePdfId,
  editingNoteRecordingId,
  effectiveActiveNoteTabId,
  getNoteLabel,
  handleDeleteNote,
  handleEditNote,
  handleUpdateNote,
  links,
  notes,
  pdfFiles,
  recordings,
  setActiveNoteTabId,
  setEditingNoteContent,
  setEditingNoteId,
  setEditingNoteLinkId,
  setEditingNotePdfId,
  setEditingNoteRecordingId,
}: NotesTabsProps) {
  const activeNote = notes.find(note => note.id === effectiveActiveNoteTabId) ?? null

  return (
    <div className="tabs">
      <div className="tabs-list">
        {notes.map((note, index) => (
          <button
            key={note.id}
            type="button"
            className={`tab-trigger ${effectiveActiveNoteTabId === note.id ? 'tab-active' : ''}`}
            onClick={() => setActiveNoteTabId(note.id)}
          >
            {getNoteLabel(note, index)}
          </button>
        ))}
      </div>
      <div className="tabs-panel">
        {!activeNote && <p className="muted">Choose a note to see details.</p>}
        {activeNote && editingNoteId === activeNote.id && (
          <NoteForm
            value={editingNoteContent}
            onChange={setEditingNoteContent}
            onSubmit={handleUpdateNote}
            submitLabel="Save"
            cancelLabel="Cancel"
            onCancel={() =>
              resetEditingAssociations(
                setEditingNoteId,
                setEditingNoteContent,
                setEditingNoteLinkId,
                setEditingNotePdfId,
                setEditingNoteRecordingId
              )
            }
            className="w-full"
            links={links}
            pdfFiles={pdfFiles}
            recordings={recordings}
            linkId={editingNoteLinkId}
            pdfId={editingNotePdfId}
            recordingId={editingNoteRecordingId}
            setLinkId={setEditingNoteLinkId}
            setPdfId={setEditingNotePdfId}
            setRecordingId={setEditingNoteRecordingId}
          />
        )}
        {activeNote && editingNoteId !== activeNote.id && (
          <div className="tabs-content">
            <div className="note-content">
              <NoteContent text={activeNote.content} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className="button-ghost"
                onClick={() => handleEditNote(activeNote)}
              >
                Edit
              </button>
              <button
                type="button"
                className="button-ghost button-danger"
                onClick={() => handleDeleteNote(activeNote.id)}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
