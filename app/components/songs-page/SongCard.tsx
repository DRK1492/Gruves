'use client'

import type { Song } from './types'

type SongCardProps = {
  disableDrag?: boolean
  onDelete: (songId: string) => void
  onDragEnd: () => void
  onDragStart: (songId: string) => void
  onGoToSong: (songId: string) => void
  onToggleMenu: (songId: string) => void
  onUpdateStatus: (songId: string, status: 'confident' | 'learning' | 'wishlist') => Promise<void>
  openMenuSongId: string | null
  setOpenMenuSongId: (value: string | null) => void
  song: Song
  showDemoPopup?: boolean
  onDismissDemo?: () => void
}

export default function SongCard({
  disableDrag,
  onDelete,
  onDragEnd,
  onDragStart,
  onGoToSong,
  onToggleMenu,
  onUpdateStatus,
  openMenuSongId,
  setOpenMenuSongId,
  song,
  showDemoPopup,
  onDismissDemo,
}: SongCardProps) {
  return (
    <div className="relative">
      <article
      draggable={!disableDrag}
      onDragStart={disableDrag ? undefined : () => onDragStart(song.id)}
      onDragEnd={disableDrag ? undefined : onDragEnd}
      onClick={() => onGoToSong(song.id)}
      className={`row row-clickable p-2 song-tile overflow-visible${!song.artist ? ' song-tile--no-artist' : ''}`}
    >
      {/* Left column: title + artist */}
      <div className="song-tile-left">
        <h3 className="font-bold truncate song-tile-title">{song.title}</h3>
        {song.artist && <p className="song-tile-artist">{song.artist}</p>}
        {song.is_demo && (
          <div className="text-xs px-1.5 py-0.5 rounded-full bg-purple-900/40 text-purple-300 whitespace-nowrap self-start">
            Demo
          </div>
        )}
      </div>
      {/* Right column: three-dot menu on top, genre pill directly below */}
      <div className="song-tile-right">
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
        {(() => {
          const firstGenre = (song.song_genres || []).find(g => g.genres?.name)
          return firstGenre ? (
            <span className="genre-pill song-tile-genre-pill">{firstGenre.genres!.name}</span>
          ) : null
        })()}
      </div>
    </article>

    {showDemoPopup && onDismissDemo && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="card p-8 max-w-md border border-accent/20">
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase mb-2">Welcome</p>
            <h2 className="text-2xl font-bold tracking-tight">Explore Gruves</h2>
          </div>

          <p className="text-sm leading-relaxed muted mb-6">
            We've created a demo song for you: <span className="text-foreground font-medium italic">Wish You Were Here</span> by Pink Floyd. Use it to discover everything Gruves offers:
          </p>

          <ul className="text-sm muted space-y-2 mb-6">
            <li className="flex gap-2">
              <span className="text-accent flex-shrink-0">→</span>
              <span>Practice loops with A/B point markers</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent flex-shrink-0">→</span>
              <span>Linked YouTube videos & resources</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent flex-shrink-0">→</span>
              <span>Notes and practice tips</span>
            </li>
          </ul>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                onGoToSong(song.id)
                onDismissDemo()
              }}
              className="button-primary"
            >
              View Demo Song
            </button>
            <button
              type="button"
              onClick={onDismissDemo}
              className="button-ghost text-sm"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
