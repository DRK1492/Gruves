'use client'

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
            <path
              d="M7 4h7l4 4v12H7z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M14 4v4h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Read</h2>
        </div>
      </div>
      <div className="section-divider" />
      <div className="flex gap-2 items-center mb-2">
        <input
          type="file"
          accept=".pdf"
          onChange={e => {
            const file = e.target.files?.[0] || null
            if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
              if (file.size > maxPdfSizeBytes) {
                setPdfError(`PDF is too large. Max size is ${Math.round(maxPdfSizeBytes / (1024 * 1024))}MB.`)
                addToast({
                  title: 'PDF too large',
                  description: 'Choose a smaller file and try again.',
                  variant: 'error'
                })
                setPdfFile(null)
                return
              }
              setPdfError('')
              setPdfFile(file)
            } else if (file) {
              console.error('Only PDF files are supported.')
              setPdfError('Only PDF files are supported.')
              addToast({ title: 'Invalid file type', description: 'Upload a PDF file.', variant: 'error' })
            } else {
              setPdfFile(null)
            }
          }}
          className="input flex-1"
        />
        <button
          onClick={handleUploadPdf}
          disabled={!pdfFile || !sessionUserId || uploading}
          className={`button-primary ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {uploading && (
        <div className="mt-2">
          <div className="h-2 bg-[var(--surface-strong)] rounded">
            <div
              className="h-2 bg-[var(--accent)] rounded"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs muted mt-1">{uploadProgress}%</p>
        </div>
      )}
      {pdfError && <p className="text-sm text-red-600 mb-3">{pdfError}</p>}
      {pdfFiles.length === 0 ? (
        <p className="muted">No PDFs uploaded yet.</p>
      ) : (
        <>
          {globalViewMode === 'table' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pdfFiles.map(file => (
                  editingPdfId === file.id ? (
                    <tr key={file.id}>
                      <td colSpan={2}>
                        <div className="table-edit">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingPdfName}
                              onChange={event => {
                                setEditingPdfName(event.target.value)
                                if (pdfError) setPdfError('')
                              }}
                              onKeyDown={event => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  handleUpdatePdfName()
                                }
                              }}
                              className="input flex-1"
                              autoFocus
                            />
                            <button type="button" className="button-primary" onClick={handleUpdatePdfName}>
                              Save
                            </button>
                            <button type="button" className="button-ghost" onClick={handleCancelPdfEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={file.id}
                      className="table-row row-clickable"
                      onClick={() => {
                        if (skipPdfRowClickRef.current) return
                        if (!editingPdfId) handlePdfRowClick(file)
                      }}
                      onDoubleClick={() => {
                        if (skipPdfRowClickRef.current) return
                        if (!editingPdfId) handlePdfRowDoubleClick(file)
                      }}
                    >
                      <td className="table-cell">{file.file_name}</td>
                      <td className="table-cell table-actions">
                        <div className="menu-container" onClick={event => event.stopPropagation()}>
                          <button
                            type="button"
                            className="button-ghost menu-trigger"
                            onClick={event => {
                              event.stopPropagation()
                              setOpenPdfMenuId(prev => (prev === file.id ? null : file.id))
                            }}
                          >
                            <span className="menu-dots" aria-hidden="true">⋯</span>
                            <span className="sr-only">PDF actions</span>
                          </button>
                          {openPdfMenuId === file.id && (
                            <div className="menu" onClick={event => event.stopPropagation()}>
                              <button
                                type="button"
                                className="menu-item"
                                onClick={() => {
                                  handleRenamePdf(file)
                                  setOpenPdfMenuId(null)
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="menu-item"
                                onClick={() => {
                                  openPdfInNewTab(file)
                                  setOpenPdfMenuId(null)
                                }}
                              >
                                Open
                              </button>
                              <button
                                type="button"
                                className="menu-item menu-danger"
                                onClick={() => {
                                  handleDeletePdf(file.id)
                                  setOpenPdfMenuId(null)
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
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
                        onChange={event => {
                          setEditingPdfName(event.target.value)
                          if (pdfError) setPdfError('')
                        }}
                        className="input flex-1"
                        autoFocus
                      />
                      <button type="button" className="button-primary" onClick={handleUpdatePdfName}>
                        Save
                      </button>
                      <button type="button" className="button-ghost" onClick={handleCancelPdfEdit}>
                        Cancel
                      </button>
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
                          onClick={event => {
                            event.stopPropagation()
                            setOpenPdfMenuId(prev => (prev === file.id ? null : file.id))
                          }}
                        >
                          <span className="menu-dots" aria-hidden="true">⋯</span>
                          <span className="sr-only">PDF actions</span>
                        </button>
                        {openPdfMenuId === file.id && (
                          <div className="menu" onClick={event => event.stopPropagation()}>
                            <button
                              type="button"
                              className="menu-item"
                              onClick={() => {
                                handleRenamePdf(file)
                                setOpenPdfMenuId(null)
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="menu-item"
                              onClick={() => {
                                openPdfInNewTab(file)
                                setOpenPdfMenuId(null)
                              }}
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              className="menu-item menu-danger"
                              onClick={() => {
                                handleDeletePdf(file.id)
                                setOpenPdfMenuId(null)
                              }}
                            >
                              Delete
                            </button>
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
                  if (!activeFile) {
                    return <p className="muted">Choose a file to see details.</p>
                  }
                  if (editingPdfId === activeFile.id) {
                    return (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingPdfName}
                          onChange={event => {
                            setEditingPdfName(event.target.value)
                            if (pdfError) setPdfError('')
                          }}
                          className="input flex-1"
                          autoFocus
                        />
                        <button type="button" className="button-primary" onClick={handleUpdatePdfName}>
                          Save
                        </button>
                        <button type="button" className="button-ghost" onClick={handleCancelPdfEdit}>
                          Cancel
                        </button>
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
                        <button
                          type="button"
                          className="button-primary"
                          onClick={() => handlePreviewPdf(activeFile)}
                        >
                          {previewPdfId === activeFile.id ? 'Hide preview' : 'Preview'}
                        </button>
                        <button
                          type="button"
                          className="button-ghost"
                          onClick={() => openPdfInNewTab(activeFile)}
                        >
                          Open in new tab
                        </button>
                        <button
                          type="button"
                          className="button-ghost"
                          onClick={() => handleRenamePdf(activeFile)}
                        >
                          Edit name
                        </button>
                        <button
                          type="button"
                          className="button-ghost button-danger"
                          onClick={() => handleDeletePdf(activeFile.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
          {previewPdfUrl && (
            <div className="mt-4" ref={pdfPreviewRef}>
              <p className="label mb-2">PDF preview</p>
              <div className="card-strong overflow-hidden">
                <iframe
                  src={previewPdfUrl}
                  title="PDF preview"
                  className="w-full h-[32rem]"
                />
              </div>
              <div className="mt-3">
                <p className="label mb-2">Linked notes</p>
                {linkedNotesForPdf.length === 0 ? (
                  <p className="text-sm muted">No linked notes yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {linkedNotesForPdf.map(note => (
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
        </>
      )}
    </div>
  )
}
