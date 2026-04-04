'use client'

import type { Song } from './types'

type SongCardProps = {
  onDelete: (songId: string) => void
  onDragEnd: () => void
  onDragStart: (songId: string) => void
  onGoToSong: (songId: string) => void
  onToggleMenu: (songId: string) => void
  onUpdateStatus: (songId: string, status: 'confident' | 'learning' | 'wishlist') => Promise<void>
  openMenuSongId: string | null
  setOpenMenuSongId: (value: string | null) => void
  song: Song
}

export default function SongCard({
  onDelete,
  onDragEnd,
  onDragStart,
  onGoToSong,
  onToggleMenu,
  onUpdateStatus,
  openMenuSongId,
  setOpenMenuSongId,
  song,
}: SongCardProps) {
  return (
    <article
      draggable
      onDragStart={() => onDragStart(song.id)}
      onDragEnd={onDragEnd}
      onClick={() => onGoToSong(song.id)}
      className="row row-clickable p-2 song-tile overflow-visible"
    >
      <div className="flex items-start justify-between gap-3 song-tile-top">
        <div className="min-w-0">
          <h3 className="font-semibold text-base truncate">{song.title}</h3>
          <p className="text-sm muted">{song.artist || 'Unknown Artist'}</p>
        </div>
        {song.is_demo && (
          <div className="text-xs px-2 py-1 rounded-full bg-purple-900/40 text-purple-300 whitespace-nowrap">
            Demo
          </div>
        )}
        <div className="menu-container">
          <button
            type="button"
            className="button-ghost menu-trigger"
            draggable={false}
            onMouseDown={event => event.stopPropagation()}
            onClick={event => {
              event.stopPropagation()
              onToggleMenu(song.id)
            }}
            aria-label="Song menu"
          >
            •••
          </button>
          {openMenuSongId === song.id && (
            <div className="menu songs-tile-menu" onClick={event => event.stopPropagation()}>
              {song.status !== 'confident' && (
                <button
                  type="button"
                  className="menu-item"
                  onClick={async event => {
                    event.stopPropagation()
                    await onUpdateStatus(song.id, 'confident')
                    setOpenMenuSongId(null)
                  }}
                >
                  Move to Confident
                </button>
              )}
              {song.status !== 'learning' && (
                <button
                  type="button"
                  className="menu-item"
                  onClick={async event => {
                    event.stopPropagation()
                    await onUpdateStatus(song.id, 'learning')
                    setOpenMenuSongId(null)
                  }}
                >
                  Move to Learning
                </button>
              )}
              {song.status !== 'wishlist' && (
                <button
                  type="button"
                  className="menu-item"
                  onClick={async event => {
                    event.stopPropagation()
                    await onUpdateStatus(song.id, 'wishlist')
                    setOpenMenuSongId(null)
                  }}
                >
                  Move to Wishlist
                </button>
              )}
              <button
                type="button"
                className="menu-item menu-danger"
                onClick={event => {
                  event.stopPropagation()
                  onDelete(song.id)
                  setOpenMenuSongId(null)
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {(song.song_genres || []).length > 0 ? (
        <div className="song-genres-slot">
          {(song.song_genres || []).slice(0, 3).map(genre => (
            <span key={genre.genre_id} className="genre-pill">
              {genre.genres?.name ?? 'Unknown'}
            </span>
          ))}
        </div>
      ) : (
        <div className="song-genres-slot invisible" aria-hidden="true" />
      )}
    </article>
  )
}
