'use client'

import NoteContent from '../../NoteContent'
import NoteActionsMenu from './NoteActionsMenu'
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
    <table className="table">
      <thead>
        <tr>
          <th>Note</th>
          <th className="table-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {notes.map(note => (
          editingNoteId === note.id ? (
            <tr key={note.id}>
              <td colSpan={2}>
                <div className="table-edit">
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
              </td>
            </tr>
          ) : (
            <tr key={note.id} className="table-row">
              <td className="table-cell note-preview">
                <NoteContent text={note.content} />
              </td>
              <td className="table-cell table-actions">
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
              </td>
            </tr>
          )
        ))}
      </tbody>
    </table>
  )
}
