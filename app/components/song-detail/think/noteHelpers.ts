import type { NoteStateSetter } from './types'

export const clearAssociatedSelections = (
  value: string,
  setters: {
    clearLink: () => void
    clearPdf: () => void
    clearRecording: () => void
  }
) => {
  if (!value) return
  setters.clearLink()
  setters.clearPdf()
  setters.clearRecording()
}

export const resetEditingAssociations = (
  setEditingNoteId: NoteStateSetter<string | null>,
  setEditingNoteContent: NoteStateSetter<string>,
  setEditingNoteLinkId: NoteStateSetter<string>,
  setEditingNotePdfId: NoteStateSetter<string>,
  setEditingNoteRecordingId: NoteStateSetter<string>
) => {
  setEditingNoteId(null)
  setEditingNoteContent('')
  setEditingNoteLinkId('')
  setEditingNotePdfId('')
  setEditingNoteRecordingId('')
}
