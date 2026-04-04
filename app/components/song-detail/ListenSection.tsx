'use client'

import dynamic from 'next/dynamic'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useEffect, useState } from 'react'
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

type SongLoopRecord = {
  id: string
  song_id: string
  link_id: string
  user_id: string
  name: string
  loop_start: number
  loop_end: number
  created_at: string
}

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
  handleSavePracticeLoop: (loop: { name: string; loopStart: number; loopEnd: number; linkId?: string }) => Promise<void>
  handleDeletePracticeLoop: (loopId: string) => Promise<void>
  handleRenamePracticeLoop: (loopId: string, name: string) => Promise<void>
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
  savedLoops: SongLoopRecord[]
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
  handleRenamePracticeLoop,
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
  savedLoops,
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

  useEffect(() => {
    if (!previewYoutubeUrl || !youtubePreviewRef.current) return
    const timeout = setTimeout(() => {
      const el = youtubePreviewRef.current
      if (!el) return
      const top = window.scrollY + el.getBoundingClientRect().top - scrollMarginTop - 12
      window.scrollTo({ top, behavior: 'smooth' })
    }, 150)
    return () => clearTimeout(timeout)
  }, [previewYoutubeUrl, scrollMarginTop, youtubePreviewRef])

  const handleShowMeClick = async () => {
    setShowDemoModal(false)
    if (links.length > 0) {
      // Check if the first link has any loops
      const firstLink = links[0]
      const firstLinkLoops = savedLoops.filter(loop => loop.link_id === firstLink.id)

      // If no loops exist and this is a demo, create the default loop
      if (isDemo && firstLinkLoops.length === 0 && sessionUserId) {
        try {
          await handleSavePracticeLoop({
            name: 'Guitar riff after the intro',
            loopStart: 41,
            loopEnd: 49,
            linkId: firstLink.id,
          })
          // Small delay to ensure state updates before opening player
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Demo loop creation error:', err)
          }
        }
      }

      handleLinkRowClick(firstLink)
    }
  }
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
      <div className="listen-add-form">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Paste a YouTube or web link…"
            value={linkUrl}
            onChange={e => {
              setLinkUrl(e.target.value)
              if (linkError) setLinkError('')
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleAddLink() }}
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
        <input
          type="text"
          placeholder="Title (optional)"
          value={linkTitle}
          onChange={e => {
            setLinkTitle(e.target.value)
            if (linkError) setLinkError('')
          }}
          className="input w-full listen-title-input"
        />
        {linkError && <p className="text-sm text-red-600 mt-1">{linkError}</p>}
      </div>
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
                onClick={handleShowMeClick}
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
        <div className="section-empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="section-empty-icon" aria-hidden="true">
            <path d="M10 13a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1 1" />
            <path d="M14 11a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1-1" />
          </svg>
          <p className="text-sm muted">No links yet — add a YouTube or web link to get started</p>
        </div>
      ) : (
        <>
          {globalViewMode === 'table' && (
            <div className="listen-link-list">
              {links.map(link => {
                const isYoutube = Boolean(getYouTubeEmbedUrl(link.url))
                return editingLinkId === link.id ? (
                  <div key={link.id} className="listen-link-card listen-link-editing">
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
                          if (event.key === 'Enter') { event.preventDefault(); handleUpdateLink() }
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
                          if (event.key === 'Enter') { event.preventDefault(); handleUpdateLink() }
                        }}
                        className="input flex-1"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleUpdateLink} className="button-primary">Save</button>
                      <button onClick={handleCancelLinkEdit} className="button-ghost">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={link.id}
                    className="listen-link-card"
                    onClick={() => {
                      if (skipLinkRowClickRef.current) return
                      if (!editingLinkId) handleLinkRowClick(link)
                    }}
                    onDoubleClick={() => {
                      if (skipLinkRowClickRef.current) return
                      if (!editingLinkId) handleLinkRowDoubleClick(link)
                    }}
                  >
                    {/* Site icon */}
                    <div className="listen-link-icon" aria-hidden="true">
                      {isYoutube ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.38 12.38 0 0 0-6.55 0A4.83 4.83 0 0 1 5.5 6.69C3.5 8.32 2.28 11 2.28 12s1.22 3.68 3.22 5.31a4.83 4.83 0 0 1 3.54-2.69 12.38 12.38 0 0 0 6.55 0 4.83 4.83 0 0 1 3.54 2.69C21.13 15.68 22.28 13 22.28 12s-1.15-3.68-2.69-5.31zM10 15V9l5 3-5 3z"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M10 13a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1 1" />
                          <path d="M14 11a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1-1" />
                        </svg>
                      )}
                    </div>
                    {/* Title + domain */}
                    <div className="listen-link-content">
                      <span className="listen-link-title">{getLinkDisplayTitle(link)}</span>
                      <span className="listen-link-domain">{getLinkSource(link.url)}</span>
                    </div>
                    {/* Hover actions */}
                    <div className="listen-link-actions" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="listen-link-action-btn"
                        title="Edit"
                        onClick={() => { handleEditLink(link); setOpenLinkMenuId(null) }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                          <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61z" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="listen-link-action-btn listen-link-action-danger"
                        title="Delete"
                        onClick={() => { handleDeleteLink(link.id); setOpenLinkMenuId(null) }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                          <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19a1.75 1.75 0 001.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225H5.405a.25.25 0 01-.249-.225l-.66-6.6z" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    {/* Play indicator */}
                    <div className="listen-link-play" aria-hidden="true">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3 2.75C3 1.784 3.784 1 4.75 1a1.75 1.75 0 01.875.234l8.5 5.25a1.75 1.75 0 010 3.032l-8.5 5.25A1.75 1.75 0 013 13.25V2.75z"/>
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
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
        <div className="listen-player-wrap" ref={youtubePreviewRef}>
          <div className="listen-player-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: 'var(--text-faint)' }}>
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.38 12.38 0 0 0-6.55 0A4.83 4.83 0 0 1 5.5 6.69C3.5 8.32 2.28 11 2.28 12s1.22 3.68 3.22 5.31a4.83 4.83 0 0 1 3.54-2.69 12.38 12.38 0 0 0 6.55 0 4.83 4.83 0 0 1 3.54 2.69C21.13 15.68 22.28 13 22.28 12s-1.15-3.68-2.69-5.31zM10 15V9l5 3-5 3z"/>
            </svg>
            <span className="text-sm font-medium">{previewYoutubeTitle || 'YouTube'}</span>
          </div>
          <div className="card-strong p-2 listen-player-container">
            <YouTubePracticePlayer
              videoUrl={previewYoutubeUrl}
              title={previewYoutubeTitle || 'YouTube player'}
              savedLoops={savedLoopsForPreviewLink}
              onSaveLoop={handleSavePracticeLoop}
              onDeleteLoop={handleDeletePracticeLoop}
              onRenameLoop={handleRenamePracticeLoop}
            />
          </div>
          {linkedNotesForLink.length > 0 && (
            <div className="mt-3">
              <p className="label mb-2">Linked notes</p>
              <ul className="space-y-2">
                {linkedNotesForLink.map(note => (
                  <li key={note.id} className="row">
                    <div className="note-content">
                      <NoteContent text={note.content} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
