'use client'

import { useState } from 'react'
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

// Accent colors matching the desktop column top-border colors in globals.css
const COLUMN_ACCENTS: Record<string, string> = {
  confident: '#4ade80',
  learning: 'var(--accent)',
  wishlist: 'rgba(255, 255, 255, 0.9)',
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
  const [mobileActiveTab, setMobileActiveTab] = useState<'confident' | 'learning' | 'wishlist'>('confident')

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
    const activeColumn = statusGroups.find(col => col.key === mobileActiveTab) ?? statusGroups[0]

    return (
      <>
        {/* ── Desktop board (768px and above) ── */}
        <div className="hidden md:block">
          <div className="songs-board">
            {statusGroups.map(column => (
              <section key={column.key} className="songs-col" data-status={column.key}>
                <h2 className="songs-col-header">
                  {column.title}
                  <span className="songs-col-count">{column.songs.length}</span>
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
        </div>

        {/* ── Mobile tab layout (below 768px) ── */}
        <div className="md:hidden">
          {/* Tab bar */}
          <div className="flex border-b border-[var(--border)] mb-3">
            {statusGroups.map(column => {
              const isActive = column.key === mobileActiveTab
              const accent = COLUMN_ACCENTS[column.key]
              return (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => setMobileActiveTab(column.key)}
                  style={{
                    borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-base transition-colors"
                >
                  <span style={{ color: isActive ? accent : 'var(--text-muted)', opacity: isActive ? 1 : 0.5, fontWeight: isActive ? 700 : 500 }}>
                    {column.title}
                  </span>
                  <span
                    className="songs-col-count"
                    style={{ opacity: isActive ? 1 : 0.45 }}
                  >
                    {column.songs.length}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active column song list */}
          <div className="songs-col-body" style={{ padding: 0 }}>
            {activeColumn.songs.length === 0 ? (
              <div className="border border-dashed border-[var(--border)] rounded px-3 py-4 text-sm muted">
                {activeColumn.emptyCopy}
              </div>
            ) : (
              activeColumn.songs.map(song => (
                <SongCard
                  key={song.id}
                  song={song}
                  disableDrag
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
        </div>
      </>
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
