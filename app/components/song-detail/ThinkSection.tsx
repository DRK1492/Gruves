'use client'

import NoteForm from './think/NoteForm'
import NotesGrid from './think/NotesGrid'
import NotesTable from './think/NotesTable'
import NotesTabs from './think/NotesTabs'
import type { ThinkSectionProps } from './think/types'

export default function ThinkSection({
  editingNoteContent,
  editingNoteId,
  editingNoteLinkId,
  editingNotePdfId,
  editingNoteRecordingId,
  effectiveActiveNoteTabId,
  getNoteLabel,
  globalViewMode,
  handleAddNote,
  handleDeleteNote,
  handleEditNote,
  handleUpdateNote,
  links,
  newNote,
  newNoteLinkId,
  newNotePdfId,
  newNoteRecordingId,
  notes,
  openNoteMenuId,
  pdfFiles,
  recordings,
  scrollMarginTop,
  sectionNavId,
  setActiveNoteTabId,
  setEditingNoteContent,
  setEditingNoteId,
  setEditingNoteLinkId,
  setEditingNotePdfId,
  setEditingNoteRecordingId,
  setNewNote,
  setNewNoteLinkId,
  setNewNotePdfId,
  setNewNoteRecordingId,
  setOpenNoteMenuId,
  thinkSectionRef,
}: ThinkSectionProps) {
  return (
    <div
      id="section-think"
      ref={thinkSectionRef}
      data-section-nav-id={sectionNavId}
      className="card p-6"
      style={{ scrollMarginTop: `${scrollMarginTop}px` }}
    >
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path
              d="M6 5h12v14H6z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9 9h6M9 13h6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Think</h2>
        </div>
      </div>
      <div className="section-divider" />
      <NoteForm
        value={newNote}
        onChange={setNewNote}
        onSubmit={handleAddNote}
        submitLabel="Save Note"
        className="mb-6"
        links={links}
        pdfFiles={pdfFiles}
        recordings={recordings}
        linkId={newNoteLinkId}
        pdfId={newNotePdfId}
        recordingId={newNoteRecordingId}
        setLinkId={setNewNoteLinkId}
        setPdfId={setNewNotePdfId}
        setRecordingId={setNewNoteRecordingId}
      />
      {notes.length === 0 ? (
        <div className="section-empty-state">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="section-empty-icon" aria-hidden="true">
            <path d="M6 5h12v14H6z" />
            <path d="M9 9h6M9 13h6M9 17h3" />
          </svg>
          <p className="text-sm muted">No notes yet — write something above</p>
        </div>
      ) : (
        <>
          {globalViewMode === 'table' && (
            <NotesTable
              editingNoteContent={editingNoteContent}
              editingNoteId={editingNoteId}
              editingNoteLinkId={editingNoteLinkId}
              editingNotePdfId={editingNotePdfId}
              editingNoteRecordingId={editingNoteRecordingId}
              handleDeleteNote={handleDeleteNote}
              handleEditNote={handleEditNote}
              handleUpdateNote={handleUpdateNote}
              links={links}
              notes={notes}
              openNoteMenuId={openNoteMenuId}
              pdfFiles={pdfFiles}
              recordings={recordings}
              setEditingNoteContent={setEditingNoteContent}
              setEditingNoteId={setEditingNoteId}
              setEditingNoteLinkId={setEditingNoteLinkId}
              setEditingNotePdfId={setEditingNotePdfId}
              setEditingNoteRecordingId={setEditingNoteRecordingId}
              setOpenNoteMenuId={setOpenNoteMenuId}
            />
          )}
          {globalViewMode === 'grid' && (
            <NotesGrid
              editingNoteContent={editingNoteContent}
              editingNoteId={editingNoteId}
              editingNoteLinkId={editingNoteLinkId}
              editingNotePdfId={editingNotePdfId}
              editingNoteRecordingId={editingNoteRecordingId}
              handleDeleteNote={handleDeleteNote}
              handleEditNote={handleEditNote}
              handleUpdateNote={handleUpdateNote}
              links={links}
              notes={notes}
              openNoteMenuId={openNoteMenuId}
              pdfFiles={pdfFiles}
              recordings={recordings}
              setEditingNoteContent={setEditingNoteContent}
              setEditingNoteId={setEditingNoteId}
              setEditingNoteLinkId={setEditingNoteLinkId}
              setEditingNotePdfId={setEditingNotePdfId}
              setEditingNoteRecordingId={setEditingNoteRecordingId}
              setOpenNoteMenuId={setOpenNoteMenuId}
            />
          )}
          {globalViewMode === 'tabs' && (
            <NotesTabs
              editingNoteContent={editingNoteContent}
              editingNoteId={editingNoteId}
              editingNoteLinkId={editingNoteLinkId}
              editingNotePdfId={editingNotePdfId}
              editingNoteRecordingId={editingNoteRecordingId}
              effectiveActiveNoteTabId={effectiveActiveNoteTabId}
              getNoteLabel={getNoteLabel}
              handleDeleteNote={handleDeleteNote}
              handleEditNote={handleEditNote}
              handleUpdateNote={handleUpdateNote}
              links={links}
              notes={notes}
              openNoteMenuId={openNoteMenuId}
              pdfFiles={pdfFiles}
              recordings={recordings}
              setActiveNoteTabId={setActiveNoteTabId}
              setEditingNoteContent={setEditingNoteContent}
              setEditingNoteId={setEditingNoteId}
              setEditingNoteLinkId={setEditingNoteLinkId}
              setEditingNotePdfId={setEditingNotePdfId}
              setEditingNoteRecordingId={setEditingNoteRecordingId}
              setOpenNoteMenuId={setOpenNoteMenuId}
            />
          )}
        </>
      )}
    </div>
  )
}
