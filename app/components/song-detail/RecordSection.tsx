'use client'

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
  openRecordingMenuId,
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
            <path
              d="M12 3v10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M8 7a4 4 0 0 0 8 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M6 11v1a6 6 0 0 0 12 0v-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M12 19v2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Record</h2>
        </div>
      </div>
      <div className="section-divider" />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1.45fr]">
        <div className="space-y-4">
          <div className="card-strong p-4">
            <p className="label mb-3">Record memo</p>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={recording ? handleStopRecording : handleStartRecording}
                className={`button-primary ${recording ? 'button-danger' : ''}`}
              >
                {recording ? 'Stop' : 'Record'}
              </button>
              <input
                type="text"
                placeholder="Recording name (optional)"
                value={recordingName}
                onChange={event => setRecordingName(event.target.value)}
                className="input flex-1 min-w-[200px]"
              />
              <button
                type="button"
                onClick={handleSaveRecording}
                disabled={!recordingAudioBlob || audioUploading}
                className={`button-ghost ${!recordingAudioBlob || audioUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {audioUploading ? 'Saving...' : 'Save'}
              </button>
            </div>
            {recording && <p className="text-xs muted mt-2">Recording in progress…</p>}
            {!recording && recordingAudioBlob && (
              <p className="text-xs text-emerald-500 mt-2">Recording ready to save.</p>
            )}
          </div>

          <div className="card-strong p-4">
            <p className="label mb-3">Upload audio</p>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
                onChange={event => {
                  const file = event.target.files?.[0] || null
                  if (!file) {
                    setAudioFile(null)
                    return
                  }
                  if (!file.type.startsWith('audio/')) {
                    setAudioError('Only audio files are supported.')
                    setAudioFile(null)
                    return
                  }
                  if (file.size > maxAudioSizeBytes) {
                    setAudioError(`Audio is too large. Max size is ${Math.round(maxAudioSizeBytes / (1024 * 1024))}MB.`)
                    setAudioFile(null)
                    return
                  }
                  setAudioError('')
                  setAudioFile(file)
                }}
                className="input flex-1 min-w-[220px]"
              />
              <button
                type="button"
                onClick={() => {
                  if (audioFile) handleUploadAudio(audioFile)
                }}
                disabled={!audioFile || audioUploading}
                className={`button-primary ${!audioFile || audioUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {audioUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            {audioError && <p className="text-sm text-red-600 mt-2">{audioError}</p>}
          </div>
        </div>

        <div className="card-strong p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="label">Library</p>
            <span className="text-xs muted">{recordings.length} item{recordings.length === 1 ? '' : 's'}</span>
          </div>

          {recordings.length === 0 ? (
            <p className="muted">No recordings yet.</p>
          ) : (
            <ul className="space-y-3">
              {recordings.map(recordingItem => (
                <li
                  key={recordingItem.id}
                  className="row space-y-3"
                  onClick={() => {
                    if (editingRecordingId) return
                    handlePreviewRecording(recordingItem)
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editingRecordingId === recordingItem.id ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            type="text"
                            value={editingRecordingName}
                            onChange={event => setEditingRecordingName(event.target.value)}
                            className="input flex-1 min-w-[200px]"
                            autoFocus
                          />
                          <button
                            type="button"
                            className="button-primary"
                            onClick={event => {
                              event.stopPropagation()
                              handleUpdateRecordingName()
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="button-ghost"
                            onClick={event => {
                              event.stopPropagation()
                              handleCancelRecordingEdit()
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium truncate">{recordingItem.file_name}</p>
                          <p className="text-xs muted">Click to play</p>
                        </>
                      )}
                    </div>
                    {editingRecordingId !== recordingItem.id && (
                      <div className="menu-container" onClick={event => event.stopPropagation()}>
                        <button
                          type="button"
                          className="button-ghost menu-trigger"
                          onClick={event => {
                            event.stopPropagation()
                            setOpenRecordingMenuId(prev => (prev === recordingItem.id ? null : recordingItem.id))
                          }}
                        >
                          <span className="menu-dots" aria-hidden="true">⋯</span>
                          <span className="sr-only">Recording actions</span>
                        </button>
                        {openRecordingMenuId === recordingItem.id && (
                          <div className="menu" onClick={event => event.stopPropagation()}>
                            <button
                              type="button"
                              className="menu-item"
                              onClick={() => {
                                handleRenameRecording(recordingItem)
                                setOpenRecordingMenuId(null)
                              }}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              className="menu-item menu-danger"
                              onClick={() => {
                                handleDeleteRecording(recordingItem.id)
                                setOpenRecordingMenuId(null)
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {previewAudioId === recordingItem.id && previewAudioUrl && (
                    <div className="space-y-3">
                      <audio controls autoPlay className="w-full" src={previewAudioUrl} />
                      <div>
                        <p className="label mb-2">Linked notes</p>
                        {linkedNotesForAudio.length === 0 ? (
                          <p className="text-sm muted">No linked notes yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {linkedNotesForAudio.map(note => (
                              <li key={note.id} className="row">
                                <div className="note-content">
                                  <NoteContent text={note.content} />
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
