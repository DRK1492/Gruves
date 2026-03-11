'use client'

import type { Setlist } from './types'

type SetlistsSectionProps = {
  dragOverSetlistId: string | null
  newSetlistName: string
  onAddSetlist: (event: React.FormEvent) => void
  onDropOnSetlist: (setlistId: string) => void
  onOpenSetlist: (setlistId: string) => void
  setDragOverSetlistId: (value: string | null) => void
  setNewSetlistName: (value: string) => void
  setlistError: string
  setlists: Setlist[]
}

export default function SetlistsSection({
  dragOverSetlistId,
  newSetlistName,
  onAddSetlist,
  onDropOnSetlist,
  onOpenSetlist,
  setDragOverSetlistId,
  setNewSetlistName,
  setlistError,
  setlists,
}: SetlistsSectionProps) {
  return (
    <>
      <div className="section-title mt-10">
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path
            d="M7 6h10M7 12h10M7 18h6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <h2 className="text-2xl font-semibold">Setlists</h2>
      </div>
      <div className="section-divider" />
      <div className="card p-5">
        <p className="text-sm muted mb-3">Drag a song onto a setlist to add it.</p>
        <form onSubmit={onAddSetlist} className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="New setlist name"
            value={newSetlistName}
            onChange={event => setNewSetlistName(event.target.value)}
            className="input flex-1"
          />
          <button type="submit" className="button-ghost">
            Add Setlist
          </button>
        </form>
        {setlistError && <p className="text-sm text-red-600 mb-2">{setlistError}</p>}
        {setlists.length === 0 ? (
          <p className="text-sm muted">No setlists yet.</p>
        ) : (
          <ul className="space-y-2">
            {setlists.map(setlist => (
              <li
                key={setlist.id}
                onDragOver={event => event.preventDefault()}
                onDragEnter={() => setDragOverSetlistId(setlist.id)}
                onDragLeave={() => setDragOverSetlistId(null)}
                onDrop={() => onDropOnSetlist(setlist.id)}
                onClick={() => onOpenSetlist(setlist.id)}
                className={`row row-clickable flex justify-between items-center ${dragOverSetlistId === setlist.id ? 'row-selected' : ''}`}
              >
                <span>{setlist.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
