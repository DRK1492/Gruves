'use client'

import NoteContent from '../../NoteContent'
import NoteActionsMenu from './NoteActionsMenu'
import NoteForm from './NoteForm'
import { resetEditingAssociations } from './noteHelpers'
import type { NoteEditSharedProps } from './types'

export default function NotesGrid({
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
  openNoteMenuId,
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
    <div className="grid grid-two">
      {notes.map(note => (
        <div
          key={note.id}
          className={`row grid-card ${openNoteMenuId === note.id ? 'row-menu-open' : ''}`}
        >
          {editingNoteId === note.id ? (
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
          ) : (
            <>
              <div className="note-content flex-1">
                <NoteContent text={note.content} />
              </div>
              <NoteActionsMenu
                note={note}
                isOpen={openNoteMenuId === note.id}
                onToggle={noteId => setOpenNoteMenuId(prev => (prev === noteId ? null : noteId))}
                onEdit={noteItem => {
                  handleEditNote(noteItem)
                  setOpenNoteMenuId(null)
                }}
                onDelete={noteId => {
                  handleDeleteNote(noteId)
                  setOpenNoteMenuId(null)
                }}
              />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
