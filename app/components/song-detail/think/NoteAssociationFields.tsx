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

  const hasAny = links.length > 0 || pdfFiles.length > 0 || recordings.length > 0
  if (!hasAny) return null

  return (
    <div className="think-assoc-row">
      <span className="think-assoc-label">Link to:</span>
      {links.length > 0 && (
        <select value={linkId} onChange={handleLinkChange} className="think-assoc-select">
          <option value="">Listen…</option>
          {links.map(link => (
            <option key={link.id} value={link.id}>{link.title || link.url}</option>
          ))}
        </select>
      )}
      {pdfFiles.length > 0 && (
        <select value={pdfId} onChange={handlePdfChange} className="think-assoc-select">
          <option value="">Read…</option>
          {pdfFiles.map(file => (
            <option key={file.id} value={file.id}>{file.file_name}</option>
          ))}
        </select>
      )}
      {recordings.length > 0 && (
        <select value={recordingId} onChange={handleRecordingChange} className="think-assoc-select">
          <option value="">Record…</option>
          {recordings.map(r => (
            <option key={r.id} value={r.id}>{r.file_name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
