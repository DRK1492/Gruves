'use client'

import type { Dispatch, RefObject, SetStateAction } from 'react'

type Setlist = {
  id: string
  name: string
}

type ViewMode = 'table' | 'grid' | 'tabs'

type SetlistsSectionProps = {
  effectiveActiveSetlistTabId: string | null
  globalViewMode: ViewMode
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
  effectiveActiveSetlistTabId,
  globalViewMode,
  handleAddSongToSetlist,
  handleCreateSetlistAndAdd,
  newSetlistName,
  scrollMarginTop,
  sectionNavId,
  selectedSetlistId,
  sessionUserId,
  setActiveSetlistTabId,
  setNewSetlistName,
  setSelectedSetlistId,
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
            <path
              d="M7 6h10M7 12h10M7 18h6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Setlists</h2>
        </div>
      </div>
      <div className="section-divider" />

      <div className="grid gap-3">
        <div className="flex items-center gap-3">
          <span className="label w-32 text-base">Add to:</span>
          <select
            value={selectedSetlistId}
            onChange={e => setSelectedSetlistId(e.target.value)}
            className="input flex-1"
          >
            <option value="">Choose setlist…</option>
            {setlists.map(setlist => (
              <option key={setlist.id} value={setlist.id}>
                {setlist.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleAddSongToSetlist()}
            disabled={!selectedSetlistId}
            className={`button-primary ${!selectedSetlistId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Add
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="label w-32 text-base">Create new setlist:</span>
          <input
            type="text"
            placeholder="New setlist name"
            value={newSetlistName}
            onChange={e => setNewSetlistName(e.target.value)}
            className="input flex-1"
          />
          <button
            onClick={handleCreateSetlistAndAdd}
            disabled={!newSetlistName.trim() || !sessionUserId}
            className={`button-ghost ${!newSetlistName.trim() || !sessionUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Create
          </button>
        </div>
      </div>

      {setlistError && <p className="text-sm text-red-600 mt-2">{setlistError}</p>}
      <div className="mt-4">
        {setlists.length === 0 ? (
          <p className="text-sm muted">No setlists yet.</p>
        ) : (
          <>
            {globalViewMode === 'table' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Setlist</th>
                    <th>Status</th>
                    <th className="table-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {setlists.map(setlist => {
                    const isInSetlist = songSetlistIds.includes(setlist.id)
                    return (
                      <tr key={setlist.id} className="table-row">
                        <td className="table-cell">{setlist.name}</td>
                        <td className="table-cell">
                          {isInSetlist ? <span className="badge">Added</span> : <span className="muted">Not added</span>}
                        </td>
                        <td className="table-cell table-actions">
                          {!isInSetlist && (
                            <button
                              type="button"
                              className="button-primary"
                              onClick={() => handleAddSongToSetlist(setlist.id)}
                            >
                              Add
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            {globalViewMode === 'grid' && (
              <div className="grid grid-two">
                {setlists.map(setlist => {
                  const isInSetlist = songSetlistIds.includes(setlist.id)
                  return (
                    <div key={setlist.id} className="row grid-card">
                      <div>
                        <p className="text-sm font-medium">{setlist.name}</p>
                        <p className="text-xs muted">{isInSetlist ? 'Added' : 'Not added yet'}</p>
                      </div>
                      {!isInSetlist && (
                        <button
                          type="button"
                          className="button-primary"
                          onClick={() => handleAddSongToSetlist(setlist.id)}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {globalViewMode === 'tabs' && (
              <div className="tabs">
                <div className="tabs-list">
                  {setlists.map(setlist => (
                    <button
                      key={setlist.id}
                      type="button"
                      className={`tab-trigger ${effectiveActiveSetlistTabId === setlist.id ? 'tab-active' : ''}`}
                      onClick={() => setActiveSetlistTabId(setlist.id)}
                    >
                      {setlist.name}
                    </button>
                  ))}
                </div>
                <div className="tabs-panel">
                  {(() => {
                    const activeSetlist =
                      setlists.find(setlist => setlist.id === effectiveActiveSetlistTabId) ?? null
                    if (!activeSetlist) {
                      return <p className="muted">Choose a setlist to see details.</p>
                    }
                    const isInSetlist = songSetlistIds.includes(activeSetlist.id)
                    return (
                      <div className="tabs-content">
                        <div>
                          <p className="text-sm font-medium">{activeSetlist.name}</p>
                          <p className="text-xs muted">{isInSetlist ? 'Song is in this setlist.' : 'Song is not in this setlist.'}</p>
                        </div>
                        {!isInSetlist && (
                          <button
                            type="button"
                            className="button-primary"
                            onClick={() => handleAddSongToSetlist(activeSetlist.id)}
                          >
                            Add to setlist
                          </button>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
