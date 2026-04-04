'use client'

import { useRef, useState } from 'react'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import NoteContent from '../NoteContent'

type SongFile = {
  id: string
  file_name: string
  file_url: string
  storage_path?: string
}

type Note = {
  id: string
  content: string
}

type ViewMode = 'table' | 'grid' | 'tabs'

type ReadSectionProps = {
  addToast: (toast: {
    title: string
    description?: string
    variant?: 'success' | 'error' | 'info'
    duration?: number
  }) => void
  editingPdfId: string | null
  editingPdfName: string
  effectiveActivePdfTabId: string | null
  globalViewMode: ViewMode
  handleCancelPdfEdit: () => void
  handleDeletePdf: (fileId: string) => void
  handlePdfRowClick: (file: SongFile) => void
  handlePdfRowDoubleClick: (file: SongFile) => void
  handlePreviewPdf: (file: SongFile) => void
  handleRenamePdf: (file: SongFile) => void
  handleUpdatePdfName: () => void
  handleUploadPdf: () => void
  linkedNotesForPdf: Note[]
  maxPdfSizeBytes: number
  openPdfInNewTab: (file: SongFile) => void
  openPdfMenuId: string | null
  pdfError: string
  pdfFile: File | null
  pdfFiles: SongFile[]
  pdfPreviewRef: RefObject<HTMLDivElement | null>
  previewPdfId: string | null
  previewPdfUrl: string | null
  readSectionRef: RefObject<HTMLDivElement | null>
  scrollMarginTop: number
  sectionNavId: string
  sessionUserId: string | null | undefined
  setEditingPdfName: Dispatch<SetStateAction<string>>
  setOpenPdfMenuId: Dispatch<SetStateAction<string | null>>
  setPdfError: Dispatch<SetStateAction<string>>
  setPdfFile: Dispatch<SetStateAction<File | null>>
  setActivePdfTabId: (id: string) => void
  skipPdfRowClickRef: RefObject<boolean>
  uploading: boolean
  uploadProgress: number
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ReadSection({
  addToast,
  editingPdfId,
  editingPdfName,
  effectiveActivePdfTabId,
  globalViewMode,
  handleCancelPdfEdit,
  handleDeletePdf,
  handlePdfRowClick,
  handlePdfRowDoubleClick,
  handlePreviewPdf,
  handleRenamePdf,
  handleUpdatePdfName,
  handleUploadPdf,
  linkedNotesForPdf,
  maxPdfSizeBytes,
  openPdfInNewTab,
  openPdfMenuId,
  pdfError,
  pdfFile,
  pdfFiles,
  pdfPreviewRef,
  previewPdfId,
  previewPdfUrl,
  readSectionRef,
  scrollMarginTop,
  sectionNavId,
  sessionUserId,
  setEditingPdfName,
  setOpenPdfMenuId,
  setPdfError,
  setPdfFile,
  setActivePdfTabId,
  skipPdfRowClickRef,
  uploading,
  uploadProgress,
}: ReadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (file: File | null) => {
    if (!file) { setPdfFile(null); return }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Only PDF files are supported.')
      addToast({ title: 'Invalid file type', description: 'Upload a PDF file.', variant: 'error' })
      return
    }
    if (file.size > maxPdfSizeBytes) {
      setPdfError(`PDF is too large. Max ${Math.round(maxPdfSizeBytes / (1024 * 1024))} MB.`)
      addToast({ title: 'PDF too large', description: 'Choose a smaller file.', variant: 'error' })
      setPdfFile(null)
      return
    }
    setPdfError('')
    setPdfFile(file)
  }

  return (
    <div
      id="section-read"
      ref={readSectionRef}
      data-section-nav-id={sectionNavId}
      className="card p-6 mb-6"
      style={{ scrollMarginTop: `${scrollMarginTop}px` }}
    >
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path d="M7 4h7l4 4v12H7z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M14 4v4h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="text-xl font-semibold">Read</h2>
        </div>
      </div>
      <div className="section-divider" />

      {/* Drop zone */}
      <div
        className={`read-drop-zone${isDragging ? ' read-drop-zone-active' : ''}${pdfFile ? ' read-drop-zone-has-file' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          handleFileSelect(e.dataTransfer.files?.[0] ?? null)
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="sr-only"
          onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
        />

        {pdfFile ? (
          <div className="read-drop-zone-file">
            <div className="read-file-icon" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 1.5h5.5L13 5v9.5H4V1.5z" />
                <path d="M9 1.5V5h4" />
                <path d="M5.5 8.5h5M5.5 11h3.5" />
              </svg>
            </div>
            <div className="read-drop-file-info">
              <span className="read-drop-file-name">{pdfFile.name}</span>
              <span className="read-drop-file-size">{formatFileSize(pdfFile.size)}</span>
            </div>
            <div className="read-drop-file-actions">
              <button
                type="button"
                className="button-primary"
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                onClick={handleUploadPdf}
                disabled={!sessionUserId || uploading}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <button
                type="button"
                className="button-ghost"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
                onClick={() => { setPdfFile(null); setPdfError(''); if (fileInputRef.current) fileInputRef.current.value = '' }}
                disabled={uploading}
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className="read-drop-zone-prompt">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-faint)', flexShrink: 0 }} aria-hidden="true">
              <path d="M4 1.5h5.5L13 5v9.5H4V1.5z" />
              <path d="M9 1.5V5h4" />
              <path d="M5.5 8.5h5M5.5 11h3.5" />
            </svg>
            <span className="read-drop-zone-label">Drop a PDF here</span>
            <span className="read-drop-zone-sep">or</span>
            <button
              type="button"
              className="read-drop-zone-browse"
              onClick={() => fileInputRef.current?.click()}
              disabled={!sessionUserId}
            >
              browse
            </button>
            <span className="read-drop-zone-hint">PDF · max {Math.round(maxPdfSizeBytes / (1024 * 1024))} MB</span>
          </div>
        )}

        {uploading && (
          <div className="read-upload-progress">
            <div className="read-upload-bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      {pdfError && <p className="text-sm text-red-400 mb-3">{pdfError}</p>}

      {/* File list */}
      {pdfFiles.length > 0 && (
        <>
          {globalViewMode === 'table' && (
            <div className="read-file-list">
              {pdfFiles.map(file => (
                editingPdfId === file.id ? (
                  <div key={file.id} className="read-file-card read-file-editing">
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingPdfName}
                        onChange={event => { setEditingPdfName(event.target.value); if (pdfError) setPdfError('') }}
                        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); handleUpdatePdfName() } }}
                        className="input flex-1"
                        autoFocus
                      />
                      <button type="button" className="button-primary" onClick={handleUpdatePdfName}>Save</button>
                      <button type="button" className="button-ghost" onClick={handleCancelPdfEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={file.id}
                    className={`read-file-card${previewPdfId === file.id ? ' read-file-card-active' : ''}`}
                    onClick={() => {
                      if (skipPdfRowClickRef.current) return
                      if (!editingPdfId) handlePdfRowClick(file)
                    }}
                    onDoubleClick={() => {
                      if (skipPdfRowClickRef.current) return
                      if (!editingPdfId) handlePdfRowDoubleClick(file)
                    }}
                  >
                    <div className="read-file-icon" aria-hidden="true">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 1.5h5.5L13 5v9.5H4V1.5z" />
                        <path d="M9 1.5V5h4" />
                        <path d="M5.5 8.5h5M5.5 11h3.5" />
                      </svg>
                    </div>
                    <div className="read-file-content">
                      <span className="read-file-name">{file.file_name}</span>
                    </div>
                    <div className="read-file-actions" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="listen-link-action-btn"
                        title="Rename"
                        onClick={() => { handleRenamePdf(file); setOpenPdfMenuId(null) }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                          <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61z" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="listen-link-action-btn"
                        title="Open in new tab"
                        onClick={() => { openPdfInNewTab(file); setOpenPdfMenuId(null) }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                          <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 1h6m0 0v6m0-6L8 8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="listen-link-action-btn listen-link-action-danger"
                        title="Delete"
                        onClick={() => { handleDeletePdf(file.id); setOpenPdfMenuId(null) }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                          <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19a1.75 1.75 0 001.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225H5.405a.25.25 0 01-.249-.225l-.66-6.6z" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    <div className="listen-link-play" aria-hidden="true">
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <ellipse cx="8" cy="8" rx="6" ry="4" />
                        <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {globalViewMode === 'grid' && (
            <div className="grid grid-two">
              {pdfFiles.map(file => (
                <div
                  key={file.id}
                  className="row row-clickable grid-card"
                  onClick={() => {
                    if (skipPdfRowClickRef.current) return
                    if (!editingPdfId) handlePdfRowClick(file)
                  }}
                  onDoubleClick={() => {
                    if (skipPdfRowClickRef.current) return
                    if (!editingPdfId) handlePdfRowDoubleClick(file)
                  }}
                >
                  {editingPdfId === file.id ? (
                    <div className="w-full flex items-center gap-2">
                      <input
                        type="text"
                        value={editingPdfName}
                        onChange={event => { setEditingPdfName(event.target.value); if (pdfError) setPdfError('') }}
                        className="input flex-1"
                        autoFocus
                      />
                      <button type="button" className="button-primary" onClick={handleUpdatePdfName}>Save</button>
                      <button type="button" className="button-ghost" onClick={handleCancelPdfEdit}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium">{file.file_name}</p>
                        <p className="text-xs muted">Click to preview · Double click to open</p>
                      </div>
                      <div className="menu-container" onClick={event => event.stopPropagation()}>
                        <button
                          type="button"
                          className="button-ghost menu-trigger"
                          onClick={event => { event.stopPropagation(); setOpenPdfMenuId(prev => (prev === file.id ? null : file.id)) }}
                        >
                          <span className="menu-dots" aria-hidden="true">⋯</span>
                          <span className="sr-only">PDF actions</span>
                        </button>
                        {openPdfMenuId === file.id && (
                          <div className="menu" onClick={event => event.stopPropagation()}>
                            <button type="button" className="menu-item" onClick={() => { handleRenamePdf(file); setOpenPdfMenuId(null) }}>Edit</button>
                            <button type="button" className="menu-item" onClick={() => { openPdfInNewTab(file); setOpenPdfMenuId(null) }}>Open</button>
                            <button type="button" className="menu-item menu-danger" onClick={() => { handleDeletePdf(file.id); setOpenPdfMenuId(null) }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {globalViewMode === 'tabs' && (
            <div className="tabs">
              <div className="tabs-list">
                {pdfFiles.map(file => (
                  <button
                    key={file.id}
                    type="button"
                    className={`tab-trigger ${effectiveActivePdfTabId === file.id ? 'tab-active' : ''}`}
                    onClick={() => setActivePdfTabId(file.id)}
                  >
                    {file.file_name}
                  </button>
                ))}
              </div>
              <div className="tabs-panel">
                {(() => {
                  const activeFile = pdfFiles.find(file => file.id === effectiveActivePdfTabId) ?? null
                  if (!activeFile) return <p className="muted">Choose a file to see details.</p>
                  if (editingPdfId === activeFile.id) {
                    return (
                      <div className="flex items-center gap-2">
                        <input type="text" value={editingPdfName} onChange={event => { setEditingPdfName(event.target.value); if (pdfError) setPdfError('') }} className="input flex-1" autoFocus />
                        <button type="button" className="button-primary" onClick={handleUpdatePdfName}>Save</button>
                        <button type="button" className="button-ghost" onClick={handleCancelPdfEdit}>Cancel</button>
                      </div>
                    )
                  }
                  return (
                    <div className="tabs-content">
                      <div>
                        <p className="text-sm font-medium">{activeFile.file_name}</p>
                        <p className="text-xs muted">PDF file stored in your library.</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button type="button" className="button-primary" onClick={() => handlePreviewPdf(activeFile)}>{previewPdfId === activeFile.id ? 'Hide preview' : 'Preview'}</button>
                        <button type="button" className="button-ghost" onClick={() => openPdfInNewTab(activeFile)}>Open in new tab</button>
                        <button type="button" className="button-ghost" onClick={() => handleRenamePdf(activeFile)}>Edit name</button>
                        <button type="button" className="button-ghost button-danger" onClick={() => handleDeletePdf(activeFile.id)}>Delete</button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {previewPdfUrl && (
            <div className="listen-player-wrap" ref={pdfPreviewRef}>
              <div className="listen-player-header">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--text-faint)' }}>
                  <path d="M4 1.5h5.5L13 5v9.5H4V1.5z" />
                  <path d="M9 1.5V5h4" />
                  <path d="M5.5 8.5h5M5.5 11h3.5" />
                </svg>
                <span className="text-sm font-medium">{pdfFiles.find(f => f.id === previewPdfId)?.file_name ?? 'PDF preview'}</span>
              </div>
              <div className="card-strong overflow-hidden">
                <iframe src={previewPdfUrl} title="PDF preview" className="w-full h-[32rem]" />
              </div>
              {linkedNotesForPdf.length > 0 && (
                <div className="mt-3">
                  <p className="label mb-2">Linked notes</p>
                  <ul className="space-y-2">
                    {linkedNotesForPdf.map(note => (
                      <li key={note.id} className="row">
                        <div className="note-content"><NoteContent text={note.content} /></div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
