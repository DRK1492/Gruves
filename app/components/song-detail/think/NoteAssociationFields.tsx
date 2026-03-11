'use client'

import type { ChangeEvent } from 'react'
import type { NoteAssociationProps } from './types'
import { clearAssociatedSelections } from './noteHelpers'

export default function NoteAssociationFields({
  links,
  pdfFiles,
  recordings,
  linkId,
  pdfId,
  recordingId,
  setLinkId,
  setPdfId,
  setRecordingId,
}: NoteAssociationProps) {
  const handleLinkChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setLinkId(value)
    clearAssociatedSelections(value, {
      clearLink: () => {},
      clearPdf: () => setPdfId(''),
      clearRecording: () => setRecordingId(''),
    })
  }

  const handlePdfChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setPdfId(value)
    clearAssociatedSelections(value, {
      clearLink: () => setLinkId(''),
      clearPdf: () => {},
      clearRecording: () => setRecordingId(''),
    })
  }

  const handleRecordingChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setRecordingId(value)
    clearAssociatedSelections(value, {
      clearLink: () => setLinkId(''),
      clearPdf: () => setPdfId(''),
      clearRecording: () => {},
    })
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <select
        value={linkId}
        onChange={handleLinkChange}
        className="input flex-1 min-w-[220px]"
        disabled={links.length === 0}
      >
        <option value="">Link to Listen item (optional)</option>
        {links.map(link => (
          <option key={link.id} value={link.id}>
            {link.title || link.url}
          </option>
        ))}
      </select>
      <select
        value={pdfId}
        onChange={handlePdfChange}
        className="input flex-1 min-w-[220px]"
        disabled={pdfFiles.length === 0}
      >
        <option value="">Link to Read item (optional)</option>
        {pdfFiles.map(file => (
          <option key={file.id} value={file.id}>
            {file.file_name}
          </option>
        ))}
      </select>
      <select
        value={recordingId}
        onChange={handleRecordingChange}
        className="input flex-1 min-w-[220px]"
        disabled={recordings.length === 0}
      >
        <option value="">Link to Record item (optional)</option>
        {recordings.map(recordingItem => (
          <option key={recordingItem.id} value={recordingItem.id}>
            {recordingItem.file_name}
          </option>
        ))}
      </select>
    </div>
  )
}
