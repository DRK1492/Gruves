'use client'

import NoteContent from '../../NoteContent'
import NoteForm from './NoteForm'
import { resetEditingAssociations } from './noteHelpers'
import type { NoteEditSharedProps } from './types'

export default function NotesTable({
  editingNoteContent,
  editingNoteId,
  editingNoteLinkId,
  editingNotePdfId,
  editingNoteRecordingId,
  handleDeleteNote,
  handleEditNote,
  handleUpdateNote,
  links,
  notes,
  openNoteMenuId: _openNoteMenuId,
  pdfFiles,
  recordings,
  setEditingNoteContent,
  setEditingNoteId,
  setEditingNoteLinkId,
  setEditingNotePdfId,
  setEditingNoteRecordingId,
  setOpenNoteMenuId,
}: NoteEditSharedProps) {
  return (
    <div className="think-note-list">
      {notes.map(note => (
        <div
          key={note.id}
          className={`think-note-card${editingNoteId === note.id ? ' think-note-card-editing' : ''}`}
        >
          {editingNoteId === note.id ? (
            <div className="think-note-edit">
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
            </div>
          ) : (
            <div className="think-note-row">
              <div className="think-note-preview">
                <NoteContent text={note.content} />
              </div>
              <div className="think-note-actions" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="listen-link-action-btn"
                  title="Edit"
                  onClick={() => {
                    handleEditNote(note)
                    setOpenNoteMenuId(null)
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                    <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61z" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="listen-link-action-btn listen-link-action-danger"
                  title="Delete"
                  onClick={() => {
                    handleDeleteNote(note.id)
                    setOpenNoteMenuId(null)
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                    <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19a1.75 1.75 0 001.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225H5.405a.25.25 0 01-.249-.225l-.66-6.6z" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
