'use client'

import type { Genre } from './types'

type AddSongModalProps = {
  artist: string
  formError: string
  genreLimitError: string
  genres: Genre[]
  newGenreName: string
  onAddGenre: () => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
  selectedGenreIds: string[]
  setArtist: (value: string) => void
  setNewGenreName: (value: string) => void
  setStatus: (value: string) => void
  setTitle: (value: string) => void
  status: string
  title: string
  toggleGenre: (genreId: string) => void
}

export default function AddSongModal({
  artist,
  formError,
  genreLimitError,
  genres,
  newGenreName,
  onAddGenre,
  onClose,
  onSubmit,
  selectedGenreIds,
  setArtist,
  setNewGenreName,
  setStatus,
  setTitle,
  status,
  title,
  toggleGenre,
}: AddSongModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">Add a New Song</h2>
          <button type="button" className="button-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <input
            type="text"
            placeholder="Song Title"
            value={title}
            onChange={event => setTitle(event.target.value)}
            required
            className="input"
          />
          <input
            type="text"
            placeholder="Artist (optional)"
            value={artist}
            onChange={event => setArtist(event.target.value)}
            className="input"
          />
          <select
            value={status}
            onChange={event => setStatus(event.target.value)}
            required
            className="input"
          >
            <option value="" disabled>Select status</option>
            <option value="confident">Confident</option>
            <option value="learning">Learning</option>
            <option value="wishlist">Wishlist</option>
          </select>
          <div className="border border-[var(--border)] rounded px-3 py-2">
            <p className="label mb-2">Genres (multi-select)</p>
            {genres.length === 0 ? (
              <p className="text-sm muted">No genres yet. Add one below.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <label key={genre.id} className="flex items-center gap-2 text-sm muted">
                    <input
                      type="checkbox"
                      checked={selectedGenreIds.includes(genre.id)}
                      onChange={() => toggleGenre(genre.id)}
                    />
                    {genre.name}
                  </label>
                ))}
              </div>
            )}
            {genreLimitError && <p className="text-xs text-red-600 mt-2">{genreLimitError}</p>}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a genre (e.g. Jazz)"
              value={newGenreName}
              onChange={event => setNewGenreName(event.target.value)}
              className="input flex-1"
            />
            <button type="button" onClick={onAddGenre} className="button-ghost">
              Add Genre
            </button>
          </div>
          <button type="submit" className="button-primary mt-2">
            Add Song
          </button>
        </form>
      </div>
    </div>
  )
}
