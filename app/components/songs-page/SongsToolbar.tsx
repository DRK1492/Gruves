'use client'

import type { Genre, SongsViewMode } from './types'

type SongsToolbarProps = {
  artistOptions: string[]
  filterArtist: string
  filterGenreId: string
  filterStatus: string
  genres: Genre[]
  onAddSong: () => void
  onClearFilters: () => void
  searchTerm: string
  setFilterArtist: (value: string) => void
  setFilterGenreId: (value: string) => void
  setFilterStatus: (value: string) => void
  setSearchTerm: (value: string) => void
  setSongsViewMode: (value: SongsViewMode) => void
  songsViewMode: SongsViewMode
}

export default function SongsToolbar({
  artistOptions,
  filterArtist,
  filterGenreId,
  filterStatus,
  genres,
  onAddSong,
  onClearFilters,
  searchTerm,
  setFilterArtist,
  setFilterGenreId,
  setFilterStatus,
  setSearchTerm,
  setSongsViewMode,
  songsViewMode,
}: SongsToolbarProps) {
  return (
    <>
      <div className="page-header">
        <h1 className="text-3xl font-semibold tracking-tight">Your Song Board</h1>
        <div className="flex items-center gap-2">
          <div className="view-toggle">
            <button
              type="button"
              className={songsViewMode === 'board' ? 'view-toggle-active' : ''}
              onClick={() => setSongsViewMode('board')}
            >
              Board
            </button>
            <button
              type="button"
              className={songsViewMode === 'list' ? 'view-toggle-active' : ''}
              onClick={() => setSongsViewMode('list')}
            >
              List
            </button>
          </div>
          <button
            type="button"
            className="button-primary button-cta"
            onClick={onAddSong}
          >
            Add Song
          </button>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search title or artist..."
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            className="input md:col-span-2"
          />
          <select
            value={filterStatus}
            onChange={event => setFilterStatus(event.target.value)}
            className="input md:col-span-1"
          >
            <option value="all">All statuses</option>
            <option value="confident">Confident</option>
            <option value="learning">Learning</option>
            <option value="wishlist">Wishlist</option>
          </select>
          <select
            value={filterGenreId}
            onChange={event => setFilterGenreId(event.target.value)}
            className="input md:col-span-1"
          >
            <option value="all">All genres</option>
            {genres.map(genre => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
          <select
            value={filterArtist}
            onChange={event => setFilterArtist(event.target.value)}
            className="input md:col-span-1"
          >
            <option value="all">All artists</option>
            {artistOptions.map(artist => (
              <option key={artist} value={artist}>
                {artist}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={onClearFilters} className="text-sm button-subtle">
            Clear filters
          </button>
        </div>
      </div>
    </>
  )
}
