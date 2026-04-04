'use client'

import type { SetlistSongRow, Song, SongGenre } from './types'

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
        <p className="label mb-3">Add Songs</p>
        <div className="section-divider" />
        <div className="grid gap-4">
          <div className="setlist-add-row">
            <span className="label setlist-add-label">From Library</span>
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
            <button onClick={onAddExistingSong} className="button-primary setlist-add-btn">
              Add
            </button>
          </div>

          <div className="setlist-add-row">
            <span className="label setlist-add-label">New Song</span>
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
            <button onClick={onCreateSongAndAdd} className="button-primary setlist-add-btn">
              Create
            </button>
          </div>
        </div>
        {songAddError && <p className="text-sm text-red-600 mt-3">{songAddError}</p>}
      </div>

      {setlistItems.length === 0 ? (
        <div className="section-empty-state">
          <svg
            viewBox="0 0 24 24"
            width="36"
            height="36"
            className="section-empty-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <p className="font-semibold text-base">No songs yet</p>
          <p className="muted text-sm">Add songs from your library or create a new one above.</p>
        </div>
      ) : (
        <>
          {savingOrder && <p className="text-sm muted mb-2">Saving order…</p>}
          <p className="label mb-3">Songs</p>
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
                className={`song-tile row-clickable${dragOverIndex === index ? ' row-selected' : ''}${openSongMenuId === item.song_id ? ' row-menu-open' : ''}`}
              >
                <span className="mono text-sm faint flex-shrink-0 self-center w-6 text-right pr-1">
                  {index + 1}
                </span>
                <div className="song-tile-left">
                  <p className="song-tile-title">{item.songs?.title}</p>
                  {item.songs?.artist && (
                    <p className="song-tile-artist">{item.songs.artist}</p>
                  )}
                </div>
                <div className="song-tile-right">
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
                  {(() => {
                    const firstGenre = (item.songs?.song_genres as SongGenre[] | undefined || []).find(g => g.genres?.name)
                    return firstGenre ? (
                      <span className="genre-pill song-tile-genre-pill">{firstGenre.genres!.name}</span>
                    ) : null
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
