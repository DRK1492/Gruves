import type { Dispatch, RefObject, SetStateAction } from 'react'

export type SongLink = {
  id: string
  title: string | null
  url: string
}

export type SongFile = {
  id: string
  file_name: string
}

export type SongRecording = {
  id: string
  file_name: string
}

export type Note = {
  id: string
  content: string
  created_at: string
  link_id?: string | null
  file_id?: string | null
  recording_id?: string | null
}

export type ViewMode = 'table' | 'grid' | 'tabs'

export type NoteStateSetter<T> = Dispatch<SetStateAction<T>>

export type NoteAssociationProps = {
  links: SongLink[]
  pdfFiles: SongFile[]
  recordings: SongRecording[]
  linkId: string
  pdfId: string
  recordingId: string
  setLinkId: NoteStateSetter<string>
  setPdfId: NoteStateSetter<string>
  setRecordingId: NoteStateSetter<string>
}

export type NoteFormProps = NoteAssociationProps & {
  value: string
  onChange: NoteStateSetter<string>
  onSubmit: () => void
  submitLabel: string
  cancelLabel?: string
  onCancel?: () => void
  className?: string
}

export type NoteEditSharedProps = {
  editingNoteId: string | null
  editingNoteContent: string
  editingNoteLinkId: string
  editingNotePdfId: string
  editingNoteRecordingId: string
  handleDeleteNote: (noteId: string) => void
  handleEditNote: (note: Note) => void
  handleUpdateNote: () => void
  links: SongLink[]
  notes: Note[]
  openNoteMenuId: string | null
  pdfFiles: SongFile[]
  recordings: SongRecording[]
  setEditingNoteContent: NoteStateSetter<string>
  setEditingNoteId: NoteStateSetter<string | null>
  setEditingNoteLinkId: NoteStateSetter<string>
  setEditingNotePdfId: NoteStateSetter<string>
  setEditingNoteRecordingId: NoteStateSetter<string>
  setOpenNoteMenuId: NoteStateSetter<string | null>
}

export type ThinkSectionProps = NoteEditSharedProps & {
  effectiveActiveNoteTabId: string | null
  getNoteLabel: (note: Note, index: number) => string
  globalViewMode: ViewMode
  handleAddNote: () => void
  newNote: string
  newNoteLinkId: string
  newNotePdfId: string
  newNoteRecordingId: string
  scrollMarginTop: number
  sectionNavId: string
  setActiveNoteTabId: (id: string) => void
  setNewNote: NoteStateSetter<string>
  setNewNoteLinkId: NoteStateSetter<string>
  setNewNotePdfId: NoteStateSetter<string>
  setNewNoteRecordingId: NoteStateSetter<string>
  thinkSectionRef: RefObject<HTMLDivElement | null>
}
