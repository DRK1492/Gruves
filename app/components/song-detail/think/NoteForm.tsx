'use client'

import NoteEditor from '../../NoteEditor'
import NoteAssociationFields from './NoteAssociationFields'
import type { NoteFormProps } from './types'

export default function NoteForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
  cancelLabel,
  onCancel,
  className,
  links,
  pdfFiles,
  recordings,
  linkId,
  pdfId,
  recordingId,
  setLinkId,
  setPdfId,
  setRecordingId,
}: NoteFormProps) {
  return (
    <div className={className}>
      <NoteEditor
        value={value}
        onChange={onChange}
        placeholder={submitLabel === 'Save Note' ? 'Add a note...' : 'Edit note...'}
        className="input note-editor w-full mb-2 min-h-[100px]"
      />
      <NoteAssociationFields
        links={links}
        pdfFiles={pdfFiles}
        recordings={recordings}
        linkId={linkId}
        pdfId={pdfId}
        recordingId={recordingId}
        setLinkId={setLinkId}
        setPdfId={setPdfId}
        setRecordingId={setRecordingId}
      />
      <div className="flex gap-3">
        <button onClick={onSubmit} className="button-primary">
          {submitLabel}
        </button>
        {onCancel && cancelLabel && (
          <button onClick={onCancel} className="button-ghost">
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  )
}
