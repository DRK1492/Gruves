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
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (onCancel && !e.currentTarget.contains(e.relatedTarget)) {
      onCancel()
    }
  }

  return (
    <div className={className} onBlur={handleBlur}>
      <NoteEditor
        value={value}
        onChange={onChange}
        placeholder={submitLabel === 'Save Note' ? 'Add a note...' : 'Edit note...'}
        className="input note-editor w-full mb-2 min-h-[72px]"
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
      <div className="flex gap-2">
        <button onClick={onSubmit} className="button-primary" style={{ padding: '0.28rem 0.7rem', fontSize: '0.8rem' }}>
          {submitLabel}
        </button>
        {onCancel && cancelLabel && (
          <button onClick={onCancel} className="button-ghost" style={{ padding: '0.28rem 0.6rem', fontSize: '0.8rem' }}>
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  )
}
