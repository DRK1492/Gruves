'use client'

import type { SetlistSongRow, Song } from './types'

type SetlistSongsSectionProps = {
  allSongs: Song[]
  dragOverIndex: number | null
  onAddExistingSong: () => void
  onCreateSongAndAdd: () => void
  onDrop: (index: number) => void
  onRemoveSong: (songId: string) => void
  onSongClick: (songId: string) => void
  openSongMenuId: string | null
  savingOrder: boolean
  selectedSongId: string
  setDragIndex: (index: number | null) => void
  setDragOverIndex: (index: number | null) => void
  setNewSongArtist: (value: string) => void
  setNewSongTitle: (value: string) => void
  setOpenSongMenuId: (updater: (prev: string | null) => string | null) => void
  setSelectedSongId: (value: string) => void
  setlistItems: SetlistSongRow[]
  songAddError: string
  newSongArtist: string
  newSongTitle: string
}

export default function SetlistSongsSection({
  allSongs,
  dragOverIndex,
  onAddExistingSong,
  onCreateSongAndAdd,
  onDrop,
  onRemoveSong,
  onSongClick,
  openSongMenuId,
  savingOrder,
  selectedSongId,
  setDragIndex,
  setDragOverIndex,
  setNewSongArtist,
  setNewSongTitle,
  setOpenSongMenuId,
  setSelectedSongId,
  setlistItems,
  songAddError,
  newSongArtist,
  newSongTitle,
}: SetlistSongsSectionProps) {
  const availableSongs = allSongs.filter(song => !setlistItems.some(item => item.song_id === song.id))

  return (
    <>
      <div className="card p-6 mb-6">
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
          <h2 className="text-xl font-semibold">Add Songs</h2>
        </div>
        <div className="section-divider" />
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <span className="label w-32 text-base">From library:</span>
            <select
              value={selectedSongId}
              onChange={event => setSelectedSongId(event.target.value)}
              className="input flex-1"
            >
              <option value="">Choose song…</option>
              {availableSongs.map(song => (
                <option key={song.id} value={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
            <button onClick={onAddExistingSong} className="button-primary">
              Add
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="label w-32 text-base">New song:</span>
            <input
              type="text"
              placeholder="Song title"
              value={newSongTitle}
              onChange={event => setNewSongTitle(event.target.value)}
              className="input flex-1"
            />
            <input
              type="text"
              placeholder="Artist (optional)"
              value={newSongArtist}
              onChange={event => setNewSongArtist(event.target.value)}
              className="input flex-1"
            />
            <button onClick={onCreateSongAndAdd} className="button-ghost">
              Create
            </button>
          </div>
        </div>
        {songAddError && <p className="text-sm text-red-600 mt-2">{songAddError}</p>}
      </div>

      {setlistItems.length === 0 ? (
        <p className="muted">No songs in this setlist yet.</p>
      ) : (
        <>
          {savingOrder && <p className="text-sm muted mb-2">Saving order...</p>}
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
            <h2 className="text-xl font-semibold">Songs</h2>
          </div>
          <div className="section-divider" />
          <ul className="space-y-2">
            {setlistItems.map((item, index) => (
              <li
                key={item.song_id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={event => event.preventDefault()}
                onDragEnter={() => setDragOverIndex(index)}
                onDragLeave={() => setDragOverIndex(null)}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                onDrop={() => onDrop(index)}
                onClick={() => onSongClick(item.song_id)}
                className={`row flex justify-between items-center ${dragOverIndex === index ? 'row-selected' : ''} ${openSongMenuId === item.song_id ? 'row-menu-open' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="mono text-sm muted w-6 text-right">{index + 1}.</span>
                  <div>
                    <p className="font-medium">{item.songs?.title}</p>
                    <p className="text-sm muted">{item.songs?.artist || 'Unknown Artist'}</p>
                  </div>
                </div>
                <div className="menu-container" onClick={event => event.stopPropagation()}>
                  <button
                    type="button"
                    className="button-ghost menu-trigger"
                    onClick={event => {
                      event.stopPropagation()
                      setOpenSongMenuId(prev => (prev === item.song_id ? null : item.song_id))
                    }}
                  >
                    <span className="menu-dots" aria-hidden="true">⋯</span>
                    <span className="sr-only">Song actions</span>
                  </button>
                  {openSongMenuId === item.song_id && (
                    <div className="menu" onClick={event => event.stopPropagation()}>
                      <button
                        type="button"
                        className="menu-item menu-danger"
                        onClick={() => {
                          onRemoveSong(item.song_id)
                          setOpenSongMenuId(() => null)
                        }}
                      >
                        Remove from setlist
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
