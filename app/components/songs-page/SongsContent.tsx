'use client'

import { useState } from 'react'
import SongCard from './SongCard'
import type { Song, SongStatusGroup } from './types'

type SongsContentProps = {
  filteredSongs: Song[]
  loading: boolean
  onDelete: (songId: string) => void
  onGoToSong: (songId: string) => void
  onToggleMenu: (songId: string) => void
  onUpdateStatus: (songId: string, status: 'confident' | 'learning' | 'wishlist') => Promise<void>
  openMenuSongId: string | null
  setOpenMenuSongId: (value: string | null) => void
  songs: Song[]
  statusGroups: SongStatusGroup[]
  showDemoPopup?: boolean
  onDismissDemo?: () => void
}

// Accent colors matching the desktop column top-border colors in globals.css
const COLUMN_ACCENTS: Record<string, string> = {
  confident: '#4ade80',
  learning: 'var(--accent)',
  wishlist: '#ffffff',
}

export default function SongsContent({
  filteredSongs,
  loading,
  onDelete,
  onGoToSong,
  onToggleMenu,
  onUpdateStatus,
  openMenuSongId,
  setOpenMenuSongId,
  songs,
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

  const activeColumn = statusGroups.find(col => col.key === mobileActiveTab) ?? statusGroups[0]

  return (
    <>
      {/* ── Desktop board (768px and above) ── */}
      <div className="hidden md:block">
        <div className="songs-board">
          {statusGroups.map(column => (
            <section key={column.key} className="songs-col" data-status={column.key}>
              <h2 className={`songs-col-header${column.key === 'confident' ? " [[data-mode='light']_&]:!text-green-700" : ''}${column.key === 'learning' ? " [[data-mode='light']_&]:!text-orange-600" : ''}${column.key === 'wishlist' ? " [[data-mode='light']_&]:!text-gray-800" : ''}`}>
                {column.title}
                <span className={`songs-col-count${column.key === 'wishlist' ? " [[data-mode='light']_&]:!text-gray-600" : ''}`}>{column.songs.length}</span>
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
                onDelete={onDelete}
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
