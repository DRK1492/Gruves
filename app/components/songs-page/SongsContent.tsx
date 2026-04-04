'use client'

import SongCard from './SongCard'
import type { Song, SongStatusGroup, SongsViewMode } from './types'

type SongsContentProps = {
  filteredSongs: Song[]
  loading: boolean
  onDelete: (songId: string) => void
  onDragEnd: () => void
  onDragStart: (songId: string) => void
  onGoToSong: (songId: string) => void
  onToggleMenu: (songId: string) => void
  onUpdateStatus: (songId: string, status: 'confident' | 'learning' | 'wishlist') => Promise<void>
  openMenuSongId: string | null
  setOpenMenuSongId: (value: string | null) => void
  songs: Song[]
  songsViewMode: SongsViewMode
  statusGroups: SongStatusGroup[]
  showDemoPopup?: boolean
  onDismissDemo?: () => void
}

export default function SongsContent({
  filteredSongs,
  loading,
  onDelete,
  onDragEnd,
  onDragStart,
  onGoToSong,
  onToggleMenu,
  onUpdateStatus,
  openMenuSongId,
  setOpenMenuSongId,
  songs,
  songsViewMode,
  statusGroups,
  showDemoPopup,
  onDismissDemo,
}: SongsContentProps) {
  if (loading) {
    return <p className="text-center">Loading...</p>
  }

  if (songs.length === 0) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-xl font-semibold">Start by adding your first song</h2>
        <p className="muted mt-2">
          Click to add a song, or a demo song will appear shortly if this is your first time.
        </p>
      </div>
    )
  }

  if (filteredSongs.length === 0) {
    return <p className="text-center muted mt-4">No songs match your filters.</p>
  }

  if (songsViewMode === 'board') {
    return (
      <div className="songs-board">
        {statusGroups.map(column => (
          <section key={column.key} className="songs-col">
            <h2 className="songs-col-header">
              {column.title} ({column.songs.length})
            </h2>
            <div className="songs-col-body">
              {column.songs.length === 0 ? (
                <div className="border border-dashed border-[var(--border)] rounded px-3 py-4 text-sm muted">
                  {column.emptyCopy}
                </div>
              ) : (
                column.songs.map(song => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onDelete={onDelete}
                    onDragEnd={onDragEnd}
                    onDragStart={onDragStart}
                    onGoToSong={onGoToSong}
                    onToggleMenu={onToggleMenu}
                    onUpdateStatus={onUpdateStatus}
                    openMenuSongId={openMenuSongId}
                    setOpenMenuSongId={setOpenMenuSongId}
                    showDemoPopup={showDemoPopup === true && song.is_demo === true}
                    onDismissDemo={onDismissDemo}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="songs-list">
      {statusGroups
        .filter(group => group.songs.length > 0)
        .map(group => (
          <section key={group.key} className="songs-list-section">
            <h2 className={`label songs-list-label ${group.statusClass}`}>
              {group.title} ({group.songs.length})
            </h2>
            <div className="songs-list-grid">
              {group.songs.map(song => (
                <SongCard
                  key={song.id}
                  song={song}
                  onDelete={onDelete}
                  onDragEnd={onDragEnd}
                  onDragStart={onDragStart}
                  onGoToSong={onGoToSong}
                  onToggleMenu={onToggleMenu}
                  onUpdateStatus={onUpdateStatus}
                  openMenuSongId={openMenuSongId}
                  setOpenMenuSongId={setOpenMenuSongId}
                  showDemoPopup={showDemoPopup === true && song.is_demo === true}
                  onDismissDemo={onDismissDemo}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  )
}
