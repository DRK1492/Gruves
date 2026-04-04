'use client'

import { useRef } from 'react'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import NoteContent from '../NoteContent'

type SongRecording = {
  id: string
  file_name: string
  file_url: string
  storage_path?: string
}

type Note = {
  id: string
  content: string
}

type RecordSectionProps = {
  audioError: string
  audioFile: File | null
  audioUploading: boolean
  handleCancelRecordingEdit: () => void
  handleDeleteRecording: (recordingId: string) => void
  handlePreviewRecording: (recording: SongRecording) => void
  handleRenameRecording: (recording: SongRecording) => void
  handleSaveRecording: () => void
  handleStartRecording: () => void
  handleStopRecording: () => void
  handleUpdateRecordingName: () => void
  handleUploadAudio: (file: File) => void
  linkedNotesForAudio: Note[]
  maxAudioSizeBytes: number
  openRecordingMenuId: string | null
  previewAudioId: string | null
  previewAudioUrl: string | null
  recordSectionRef: RefObject<HTMLDivElement | null>
  recording: boolean
  recordingAudioBlob: Blob | null
  recordingName: string
  recordings: SongRecording[]
  scrollMarginTop: number
  sectionNavId: string
  setAudioError: Dispatch<SetStateAction<string>>
  setAudioFile: Dispatch<SetStateAction<File | null>>
  setEditingRecordingName: Dispatch<SetStateAction<string>>
  setOpenRecordingMenuId: Dispatch<SetStateAction<string | null>>
  setRecordingName: Dispatch<SetStateAction<string>>
  editingRecordingId: string | null
  editingRecordingName: string
}

// Mic icon
function MicIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <rect x="5" y="1" width="6" height="8" rx="3" />
      <path d="M3 7v1a5 5 0 0010 0V7" />
      <path d="M8 14v2" />
    </svg>
  )
}

export default function RecordSection({
  audioError,
  audioFile,
  audioUploading,
  handleCancelRecordingEdit,
  handleDeleteRecording,
  handlePreviewRecording,
  handleRenameRecording,
  handleSaveRecording,
  handleStartRecording,
  handleStopRecording,
  handleUpdateRecordingName,
  handleUploadAudio,
  linkedNotesForAudio,
  maxAudioSizeBytes,
  openRecordingMenuId: _openRecordingMenuId,
  previewAudioId,
  previewAudioUrl,
  recordSectionRef,
  recording,
  recordingAudioBlob,
  recordingName,
  recordings,
  scrollMarginTop,
  sectionNavId,
  setAudioError,
  setAudioFile,
  setEditingRecordingName,
  setOpenRecordingMenuId,
  setRecordingName,
  editingRecordingId,
  editingRecordingName,
}: RecordSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (file: File | null) => {
    if (!file) { setAudioFile(null); return }
    if (!file.type.startsWith('audio/')) {
      setAudioError('Only audio files are supported.')
      setAudioFile(null)
      return
    }
    if (file.size > maxAudioSizeBytes) {
      setAudioError(`Audio is too large. Max ${Math.round(maxAudioSizeBytes / (1024 * 1024))} MB.`)
      setAudioFile(null)
      return
    }
    setAudioError('')
    setAudioFile(file)
  }

  // Determine action bar state
  const barState: 'recording' | 'blob' | 'file' | 'idle' =
    recording ? 'recording'
    : recordingAudioBlob ? 'blob'
    : audioFile ? 'file'
    : 'idle'

  return (
    <div
      id="section-record"
      ref={recordSectionRef}
      data-section-nav-id={sectionNavId}
      className="card p-6 mb-6"
      style={{ scrollMarginTop: `${scrollMarginTop}px` }}
    >
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 10v1a7 7 0 0014 0v-1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 19v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <h2 className="text-xl font-semibold">Record</h2>
        </div>
      </div>
      <div className="section-divider" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
        className="sr-only"
        onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
      />

      {/* Compact action bar */}
      <div className="record-action-bar">
        {barState === 'idle' && (
          <>
            <button
              type="button"
              className="button-primary"
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={handleStartRecording}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} aria-hidden="true" />
              Record
            </button>
            <span className="record-action-sep">or</span>
            <button
              type="button"
              className="record-action-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              upload audio
            </button>
            <span className="record-action-hint">
              mp3 / wav / ogg · max {Math.round(maxAudioSizeBytes / (1024 * 1024))} MB
            </span>
          </>
        )}

        {barState === 'recording' && (
          <>
            <button
              type="button"
              className="button-primary"
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', background: '#dc2626', borderColor: '#dc2626' }}
              onClick={handleStopRecording}
            >
              Stop
            </button>
            <span className="record-live-dot" aria-hidden="true" />
            <span className="record-live-label">Recording…</span>
          </>
        )}

        {barState === 'blob' && (
          <>
            <input
              type="text"
              className="record-name-input"
              placeholder="Name this recording (optional)"
              value={recordingName}
              onChange={e => setRecordingName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveRecording() }}
            />
            <div className="record-ready-actions">
              <button
                type="button"
                className="button-primary"
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                onClick={handleSaveRecording}
                disabled={audioUploading}
              >
                {audioUploading ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="button-ghost"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
                onClick={() => { setRecordingName('') }}
                disabled={audioUploading}
              >
                ×
              </button>
            </div>
          </>
        )}

        {barState === 'file' && audioFile && (
          <>
            <div className="record-icon" aria-hidden="true">
              <MicIcon size={12} />
            </div>
            <div className="record-ready-info">
              <span className="record-ready-name">{audioFile.name}</span>
              <span className="record-ready-sub">
                {audioFile.size < 1024 * 1024
                  ? `${(audioFile.size / 1024).toFixed(0)} KB`
                  : `${(audioFile.size / (1024 * 1024)).toFixed(1)} MB`}
              </span>
            </div>
            <div className="record-ready-actions">
              <button
                type="button"
                className="button-primary"
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => handleUploadAudio(audioFile)}
                disabled={audioUploading}
              >
                {audioUploading ? 'Uploading…' : 'Upload'}
              </button>
              <button
                type="button"
                className="button-ghost"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
                onClick={() => { setAudioFile(null); setAudioError(''); if (fileInputRef.current) fileInputRef.current.value = '' }}
                disabled={audioUploading}
              >
                ×
              </button>
            </div>
          </>
        )}
      </div>

      {audioError && <p className="text-sm text-red-400 mb-3" style={{ marginTop: '-0.25rem' }}>{audioError}</p>}

      {/* Recordings list */}
      {recordings.length === 0 ? (
        <div className="section-empty-state">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="section-empty-icon" aria-hidden="true">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 10v1a7 7 0 0014 0v-1" />
            <path d="M12 19v3" />
          </svg>
          <p className="text-sm muted">No recordings yet — hit Record or upload an audio file</p>
        </div>
      ) : (
        <div className="record-list">
          {recordings.map(rec => (
            editingRecordingId === rec.id ? (
              <div key={rec.id} className="record-edit-row">
                <input
                  type="text"
                  value={editingRecordingName}
                  onChange={e => setEditingRecordingName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleUpdateRecordingName() } }}
                  className="record-name-input flex-1"
                  autoFocus
                />
                <button type="button" className="button-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }} onClick={handleUpdateRecordingName}>Save</button>
                <button type="button" className="button-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }} onClick={handleCancelRecordingEdit}>Cancel</button>
              </div>
            ) : (
              <div
                key={rec.id}
                className={`record-card${previewAudioId === rec.id ? ' record-card-active' : ''}`}
              >
                <div
                  className="record-card-row"
                  onClick={() => handlePreviewRecording(rec)}
                >
                  <div className="record-icon" aria-hidden="true">
                    <MicIcon size={12} />
                  </div>
                  <span className="record-card-name">{rec.file_name}</span>
                  <div className="record-card-actions" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="listen-link-action-btn"
                      title="Rename"
                      onClick={() => { handleRenameRecording(rec); setOpenRecordingMenuId(null) }}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                        <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61z" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="listen-link-action-btn listen-link-action-danger"
                      title="Delete"
                      onClick={() => handleDeleteRecording(rec.id)}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                        <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19a1.75 1.75 0 001.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225H5.405a.25.25 0 01-.249-.225l-.66-6.6z" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {previewAudioId === rec.id && previewAudioUrl && (
                  <div className="record-audio-wrap">
                    <audio controls autoPlay className="w-full" src={previewAudioUrl} />
                    {linkedNotesForAudio.length > 0 && (
                      <div>
                        <p className="label mb-2">Linked notes</p>
                        <ul className="space-y-2">
                          {linkedNotesForAudio.map(note => (
                            <li key={note.id} className="row">
                              <div className="note-content"><NoteContent text={note.content} /></div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
