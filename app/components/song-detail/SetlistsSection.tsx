'use client'

import Link from 'next/link'
import type { Dispatch, RefObject, SetStateAction } from 'react'

type Setlist = {
  id: string
  name: string
}

type SetlistsSectionProps = {
  effectiveActiveSetlistTabId: string | null
  globalViewMode: 'table' | 'grid' | 'tabs'
  handleAddSongToSetlist: (setlistId?: string) => void
  handleCreateSetlistAndAdd: () => void
  newSetlistName: string
  scrollMarginTop: number
  sectionNavId: string
  selectedSetlistId: string
  sessionUserId: string | null | undefined
  setActiveSetlistTabId: (id: string) => void
  setNewSetlistName: Dispatch<SetStateAction<string>>
  setSelectedSetlistId: Dispatch<SetStateAction<string>>
  setlistError: string
  setlists: Setlist[]
  setlistsSectionRef: RefObject<HTMLDivElement | null>
  songSetlistIds: string[]
}

export default function SetlistsSection({
  handleAddSongToSetlist,
  handleCreateSetlistAndAdd,
  newSetlistName,
  scrollMarginTop,
  sectionNavId,
  sessionUserId,
  setNewSetlistName,
  setlistError,
  setlists,
  setlistsSectionRef,
  songSetlistIds,
}: SetlistsSectionProps) {
  return (
    <div
      id="section-setlists"
      ref={setlistsSectionRef}
      data-section-nav-id={sectionNavId}
      className="card p-6 mt-6"
      style={{ scrollMarginTop: `${scrollMarginTop}px` }}
    >
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path d="M7 6h10M7 12h10M7 18h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <h2 className="text-xl font-semibold">Setlists</h2>
        </div>
      </div>
      <div className="section-divider" />

      {/* Create new setlist — compact action bar */}
      <div className="setlist-create-bar">
        <input
          type="text"
          className="setlist-create-input"
          placeholder="New setlist name…"
          value={newSetlistName}
          onChange={e => setNewSetlistName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newSetlistName.trim()) handleCreateSetlistAndAdd() }}
          disabled={!sessionUserId}
        />
        <button
          type="button"
          className="button-primary"
          style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', flexShrink: 0 }}
          onClick={handleCreateSetlistAndAdd}
          disabled={!newSetlistName.trim() || !sessionUserId}
        >
          Create setlist
        </button>
      </div>

      {setlistError && <p className="text-sm text-red-400 mb-3" style={{ marginTop: '-0.25rem' }}>{setlistError}</p>}

      {/* Setlist chips */}
      {setlists.length === 0 ? (
        <div className="section-empty-state">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="section-empty-icon" aria-hidden="true">
            <path d="M7 6h10M7 12h10M7 18h6" />
          </svg>
          <p className="text-sm muted">No setlists yet — create one above</p>
        </div>
      ) : (
        <div className="setlist-chip-grid">
          {setlists.map(setlist => {
            const added = songSetlistIds.includes(setlist.id)
            if (added) {
              return (
                <Link
                  key={setlist.id}
                  href={`/setlists/${setlist.id}`}
                  className="setlist-chip setlist-chip-added"
                  title={`Go to ${setlist.name}`}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 8l4 4 8-8" />
                  </svg>
                  {setlist.name}
                </Link>
              )
            }
            return (
              <button
                key={setlist.id}
                type="button"
                className="setlist-chip"
                onClick={() => handleAddSongToSetlist(setlist.id)}
                title={`Add to ${setlist.name}`}
              >
                {setlist.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
