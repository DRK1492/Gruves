'use client'

import dynamic from 'next/dynamic'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useState } from 'react'
import NoteContent from '../NoteContent'
import type { PracticeLoop } from '../YouTubePracticePlayer'
import { getYouTubeEmbedUrl } from '@/utils/youtubeHelpers'

const YouTubePracticePlayer = dynamic(() => import('../YouTubePracticePlayer'), {
  ssr: false,
})

type SongLink = {
  id: string
  title: string | null
  url: string
}

type Note = {
  id: string
  content: string
}

type ViewMode = 'table' | 'grid' | 'tabs'

type ListenSectionProps = {
  editingLinkId: string | null
  editingLinkTitle: string
  editingLinkUrl: string
  effectiveActiveLinkTabId: string | null
  getLinkDisplayTitle: (link: SongLink) => string
  getLinkSource: (url: string) => string
  globalViewMode: ViewMode
  handleAddLink: () => void
  handleCancelLinkEdit: () => void
  handleDeleteLink: (linkId: string) => void
  handleEditLink: (link: SongLink) => void
  handleLinkRowClick: (link: SongLink) => void
  handleLinkRowDoubleClick: (link: SongLink) => void
  handleOpenLink: (link: SongLink) => void
  handleSavePracticeLoop: (loop: { name: string; loopStart: number; loopEnd: number }) => Promise<void>
  handleDeletePracticeLoop: (loopId: string) => Promise<void>
  handleUpdateLink: () => void
  linkError: string
  linkTitle: string
  linkUrl: string
  linkedNotesForLink: Note[]
  links: SongLink[]
  listenSectionRef: RefObject<HTMLDivElement | null>
  openLinkMenuId: string | null
  previewYoutubeTitle: string
  previewYoutubeUrl: string | null
  savedLoopsForPreviewLink: PracticeLoop[]
  scrollMarginTop: number
  sectionNavId: string
  sessionUserId: string | null | undefined
  setActiveLinkTabId: (id: string) => void
  setEditingLinkTitle: Dispatch<SetStateAction<string>>
  setEditingLinkUrl: Dispatch<SetStateAction<string>>
  setLinkError: Dispatch<SetStateAction<string>>
  setLinkTitle: Dispatch<SetStateAction<string>>
  setLinkUrl: Dispatch<SetStateAction<string>>
  setOpenLinkMenuId: Dispatch<SetStateAction<string | null>>
  skipLinkRowClickRef: RefObject<boolean>
  youtubePreviewRef: RefObject<HTMLDivElement | null>
  isDemo?: boolean
}

export default function ListenSection({
  editingLinkId,
  editingLinkTitle,
  editingLinkUrl,
  effectiveActiveLinkTabId,
  getLinkDisplayTitle,
  getLinkSource,
  globalViewMode,
  handleAddLink,
  handleCancelLinkEdit,
  handleDeleteLink,
  handleEditLink,
  handleLinkRowClick,
  handleLinkRowDoubleClick,
  handleOpenLink,
  handleSavePracticeLoop,
  handleDeletePracticeLoop,
  handleUpdateLink,
  linkError,
  linkTitle,
  linkUrl,
  linkedNotesForLink,
  links,
  listenSectionRef,
  openLinkMenuId,
  previewYoutubeTitle,
  previewYoutubeUrl,
  savedLoopsForPreviewLink,
  scrollMarginTop,
  sectionNavId,
  sessionUserId,
  setActiveLinkTabId,
  setEditingLinkTitle,
  setEditingLinkUrl,
  setLinkError,
  setLinkTitle,
  setLinkUrl,
  setOpenLinkMenuId,
  skipLinkRowClickRef,
  youtubePreviewRef,
  isDemo,
}: ListenSectionProps) {
  const [showDemoModal, setShowDemoModal] = useState(isDemo && links.length > 0)
  return (
    <div
      id="section-listen"
      ref={listenSectionRef}
      data-section-nav-id={sectionNavId}
      className="card p-6 mb-6"
      style={{ scrollMarginTop: `${scrollMarginTop}px` }}
    >
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path
              d="M10 13a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1 1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M14 11a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Listen</h2>
        </div>
      </div>
      <div className="section-divider" />
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Title (optional)"
          value={linkTitle}
          onChange={e => {
            setLinkTitle(e.target.value)
            if (linkError) setLinkError('')
          }}
          className="input flex-1"
        />
        <input
          type="url"
          placeholder="https://..."
          value={linkUrl}
          onChange={e => {
            setLinkUrl(e.target.value)
            if (linkError) setLinkError('')
          }}
          className="input flex-1"
        />
        <button
          onClick={handleAddLink}
          disabled={!linkUrl.trim() || !sessionUserId}
          className={`button-primary ${!linkUrl.trim() || !sessionUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Add
        </button>
      </div>
      {linkError && <p className="text-sm text-red-600 mb-3">{linkError}</p>}
      {showDemoModal && isDemo && links.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card p-6 max-w-md border border-accent/20">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wide text-accent uppercase mb-2">Quick tip</p>
              <h3 className="text-lg font-bold tracking-tight">Try the Practice Player</h3>
            </div>

            <p className="text-sm leading-relaxed muted mb-6">
              Click on the YouTube link to open our practice player. You can create A/B loops to practice specific sections!
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDemoModal(false)
                  if (links.length > 0) {
                    handleLinkRowClick(links[0])
                  }
                }}
                className="button-primary"
              >
                Show me
              </button>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="button-ghost text-sm"
              >
                I'll view later
              </button>
            </div>
          </div>
        </div>
      )}
      {links.length === 0 ? (
        <p className="muted">No links yet.</p>
      ) : (
        <>
          {globalViewMode === 'table' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Source</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  editingLinkId === link.id ? (
                    <tr key={link.id}>
                      <td colSpan={3}>
                        <div className="table-edit">
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Title (optional)"
                              value={editingLinkTitle}
                              onChange={e => {
                                setEditingLinkTitle(e.target.value)
                                if (linkError) setLinkError('')
                              }}
                              onKeyDown={event => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  handleUpdateLink()
                                }
                              }}
                              className="input flex-1"
                              autoFocus
                            />
                            <input
                              type="url"
                              placeholder="https://..."
                              value={editingLinkUrl}
                              onChange={e => {
                                setEditingLinkUrl(e.target.value)
                                if (linkError) setLinkError('')
                              }}
                              onKeyDown={event => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  handleUpdateLink()
                                }
                              }}
                              className="input flex-1"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button onClick={handleUpdateLink} className="button-primary">
                              Save
                            </button>
                            <button onClick={handleCancelLinkEdit} className="button-ghost">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={link.id}
                      className="table-row row-clickable"
                      onClick={() => {
                        if (skipLinkRowClickRef.current) return
                        if (!editingLinkId) handleLinkRowClick(link)
                      }}
                      onDoubleClick={() => {
                        if (skipLinkRowClickRef.current) return
                        if (!editingLinkId) handleLinkRowDoubleClick(link)
                      }}
                    >
                      <td className="table-cell">{getLinkDisplayTitle(link)}</td>
                      <td className="table-cell muted">{getLinkSource(link.url)}</td>
                      <td className="table-cell table-actions">
                        <div className="menu-container" onClick={event => event.stopPropagation()}>
                          <button
                            type="button"
                            className="button-ghost menu-trigger"
                            onClick={event => {
                              event.stopPropagation()
                              setOpenLinkMenuId(prev => (prev === link.id ? null : link.id))
                            }}
                          >
                            <span className="menu-dots" aria-hidden="true">⋯</span>
                            <span className="sr-only">Link actions</span>
                          </button>
                          {openLinkMenuId === link.id && (
                            <div className="menu" onClick={event => event.stopPropagation()}>
                              <button
                                type="button"
                                className="menu-item"
                                onClick={() => {
                                  handleEditLink(link)
                                  setOpenLinkMenuId(null)
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="menu-item"
                                onClick={() => {
                                  window.open(link.url, '_blank', 'noopener,noreferrer')
                                  setOpenLinkMenuId(null)
                                }}
                              >
                                Open
                              </button>
                              <button
                                type="button"
                                className="menu-item menu-danger"
                                onClick={() => {
                                  handleDeleteLink(link.id)
                                  setOpenLinkMenuId(null)
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
              {links.map(link => (
                <div
                  key={link.id}
                  className="row row-clickable grid-card"
                  onClick={() => {
                    if (skipLinkRowClickRef.current) return
                    if (!editingLinkId) handleLinkRowClick(link)
                  }}
                  onDoubleClick={() => {
                    if (skipLinkRowClickRef.current) return
                    if (!editingLinkId) handleLinkRowDoubleClick(link)
                  }}
                >
                  {editingLinkId === link.id ? (
                    <div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Title (optional)"
                          value={editingLinkTitle}
                          onChange={e => {
                            setEditingLinkTitle(e.target.value)
                            if (linkError) setLinkError('')
                          }}
                          className="input flex-1"
                          autoFocus
                        />
                        <input
                          type="url"
                          placeholder="https://..."
                          value={editingLinkUrl}
                          onChange={e => {
                            setEditingLinkUrl(e.target.value)
                            if (linkError) setLinkError('')
                          }}
                          className="input flex-1"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleUpdateLink} className="button-primary">
                          Save
                        </button>
                        <button onClick={handleCancelLinkEdit} className="button-ghost">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium">{getLinkDisplayTitle(link)}</p>
                        <p className="text-xs muted">{getLinkSource(link.url)}</p>
                      </div>
                      <div className="menu-container" onClick={event => event.stopPropagation()}>
                        <button
                          type="button"
                          className="button-ghost menu-trigger"
                          onClick={event => {
                            event.stopPropagation()
                            setOpenLinkMenuId(prev => (prev === link.id ? null : link.id))
                          }}
                        >
                          <span className="menu-dots" aria-hidden="true">⋯</span>
                          <span className="sr-only">Link actions</span>
                        </button>
                        {openLinkMenuId === link.id && (
                          <div className="menu" onClick={event => event.stopPropagation()}>
                            <button
                              type="button"
                              className="menu-item"
                              onClick={() => {
                                handleEditLink(link)
                                setOpenLinkMenuId(null)
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="menu-item"
                              onClick={() => {
                                window.open(link.url, '_blank', 'noopener,noreferrer')
                                setOpenLinkMenuId(null)
                              }}
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              className="menu-item menu-danger"
                              onClick={() => {
                                handleDeleteLink(link.id)
                                setOpenLinkMenuId(null)
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
                {links.map(link => (
                  <button
                    key={link.id}
                    type="button"
                    className={`tab-trigger ${effectiveActiveLinkTabId === link.id ? 'tab-active' : ''}`}
                    onClick={() => setActiveLinkTabId(link.id)}
                  >
                    {getLinkDisplayTitle(link)}
                  </button>
                ))}
              </div>
              <div className="tabs-panel">
                {(() => {
                  const activeLink = links.find(link => link.id === effectiveActiveLinkTabId) ?? null
                  if (!activeLink) {
                    return <p className="muted">Choose a link to see details.</p>
                  }
                  if (editingLinkId === activeLink.id) {
                    return (
                      <div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Title (optional)"
                            value={editingLinkTitle}
                            onChange={e => {
                              setEditingLinkTitle(e.target.value)
                              if (linkError) setLinkError('')
                            }}
                            className="input flex-1"
                            autoFocus
                          />
                          <input
                            type="url"
                            placeholder="https://..."
                            value={editingLinkUrl}
                            onChange={e => {
                              setEditingLinkUrl(e.target.value)
                              if (linkError) setLinkError('')
                            }}
                            className="input flex-1"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={handleUpdateLink} className="button-primary">
                            Save
                          </button>
                          <button onClick={handleCancelLinkEdit} className="button-ghost">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )
                  }
                  const isYoutube = Boolean(getYouTubeEmbedUrl(activeLink.url))
                  return (
                    <div className="tabs-content">
                      <div>
                        <p className="text-sm font-medium">{getLinkDisplayTitle(activeLink)}</p>
                        <p className="text-xs muted">{getLinkSource(activeLink.url)}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="button-primary"
                          onClick={() => handleOpenLink(activeLink)}
                        >
                          {isYoutube ? 'Preview' : 'Open'}
                        </button>
                        <button
                          type="button"
                          className="button-ghost"
                          onClick={() => window.open(activeLink.url, '_blank', 'noopener,noreferrer')}
                        >
                          Open in new tab
                        </button>
                        <button
                          type="button"
                          className="button-ghost"
                          onClick={() => handleEditLink(activeLink)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button-ghost button-danger"
                          onClick={() => handleDeleteLink(activeLink.id)}
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
        </>
      )}
      {previewYoutubeUrl && (
        <div className="mt-4" ref={youtubePreviewRef}>
          <p className="label mb-2">Video preview</p>
          <div className="card-strong p-2">
            <p className="text-sm font-medium mb-2 mono">{previewYoutubeTitle || 'YouTube'}</p>
            <YouTubePracticePlayer
              videoUrl={previewYoutubeUrl}
              title={previewYoutubeTitle || 'YouTube player'}
              savedLoops={savedLoopsForPreviewLink}
              onSaveLoop={handleSavePracticeLoop}
              onDeleteLoop={handleDeletePracticeLoop}
            />
            <div className="mt-3">
              <p className="label mb-2">Linked notes</p>
              {linkedNotesForLink.length === 0 ? (
                <p className="text-sm muted">No linked notes yet.</p>
              ) : (
                <ul className="space-y-2">
                  {linkedNotesForLink.map(note => (
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
        </div>
      )}
    </div>
  )
}
