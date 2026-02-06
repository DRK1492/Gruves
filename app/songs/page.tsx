'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

interface Song {
  id: string
  title: string
  artist: string
  status: string
  isPending?: boolean
  song_genres?: SongGenre[]
}

interface Genre {
  id: string
  name: string
}

interface Setlist {
  id: string
  name: string
}

interface SongGenre {
  genre_id: string
  genres: {
    name: string
  } | null
}

export default function SongsPage() {
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [status, setStatus] = useState('learning')
  const [genres, setGenres] = useState<Genre[]>([])
  const [newGenreName, setNewGenreName] = useState('')
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterGenreId, setFilterGenreId] = useState('all')
  const [filterArtist, setFilterArtist] = useState('all')
  const [formError, setFormError] = useState('')
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [newSetlistName, setNewSetlistName] = useState('')
  const [setlistError, setSetlistError] = useState('')
  const [draggingSongId, setDraggingSongId] = useState<string | null>(null)
  const [dragOverSetlistId, setDragOverSetlistId] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [undoDelete, setUndoDelete] = useState<{
    song: Song
    index: number
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    fetchSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Fetch songs for current user
  useEffect(() => {
    const fetchSongs = async () => {
      if (!session) return
      const { data, error } = await supabase
        .from('songs')
        .select('*, song_genres(genre_id, genres(name))')
        .eq('user_id', session.user.id)
      if (error) console.log(error)
      else setSongs(data as Song[])
      setLoading(false)
    }
    fetchSongs()
  }, [session])

  useEffect(() => {
    const fetchGenres = async () => {
      if (!session) return
      const { data, error } = await supabase
        .from('genres')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true })
      if (error) console.log(error)
      else setGenres(data as Genre[])
    }
    fetchGenres()
  }, [session])

  useEffect(() => {
    const fetchSetlists = async () => {
      if (!session) return
      const { data, error } = await supabase
        .from('setlists')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true })
      if (error) console.log(error)
      else setSetlists(data as Setlist[])
    }
    fetchSetlists()
  }, [session])

  useEffect(() => {
    return () => {
      if (undoDelete?.timeoutId) clearTimeout(undoDelete.timeoutId)
    }
  }, [undoDelete])

  useEffect(() => {
    if (!session) return
    const hasSeen = window.localStorage.getItem('gt_onboarded') === '1'
    if (!hasSeen) setShowOnboarding(true)
  }, [session])

  const dismissOnboarding = () => {
    window.localStorage.setItem('gt_onboarded', '1')
    setShowOnboarding(false)
  }

  const handleAddSetlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !newSetlistName.trim()) return
    setSetlistError('')
    const { data, error } = await supabase
      .from('setlists')
      .insert([{ user_id: session.user.id, name: newSetlistName.trim() }])
      .select()
      .single()
    if (error) {
      console.log('Error adding setlist:', error)
      setSetlistError('Could not add setlist. Try a different name.')
      return
    }
    if (data) {
      setSetlists(prev => [...prev, data as Setlist].sort((a, b) => a.name.localeCompare(b.name)))
      setNewSetlistName('')
    }
  }

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !newGenreName.trim()) return
    setFormError('')
    const { data, error } = await supabase
      .from('genres')
      .insert([{ user_id: session.user.id, name: newGenreName.trim() }])
      .select()
      .single()
    if (error) {
      console.log('Error adding genre:', error)
      setFormError('Could not add genre. Try a different name.')
      return
    }
    if (data) {
      setGenres(prev => [...prev, data as Genre].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedGenreIds(prev =>
        prev.includes((data as Genre).id) ? prev : [...prev, (data as Genre).id]
      )
      setNewGenreName('')
    }
  }

  const toggleGenre = (genreId: string) => {
    setSelectedGenreIds(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    )
  }

  const handleDragStart = (songId: string) => {
    setDraggingSongId(songId)
  }

  const handleDragEnd = () => {
    setDraggingSongId(null)
    setDragOverSetlistId(null)
  }

  const handleDropOnSetlist = async (setlistId: string) => {
    if (!session?.user?.id || !draggingSongId) return
    const { data: lastItem } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
      .eq('user_id', session.user.id)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = (lastItem?.[0]?.position ?? -1) + 1
    const { error } = await supabase.from('setlist_songs').insert({
      setlist_id: setlistId,
      song_id: draggingSongId,
      user_id: session.user.id,
      position: nextPosition
    })
    if (error) {
      console.log('Error adding songs to setlist:', error)
      return
    }
    setDraggingSongId(null)
    setDragOverSetlistId(null)
  }

  // Add new song (Optimistic Update)
  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setFormError('')

    const normalizedTitle = title.trim().toLowerCase()
    const normalizedArtist = artist.trim().toLowerCase()
    const duplicate = songs.find(song => {
      const songTitle = song.title?.trim().toLowerCase()
      const songArtist = (song.artist || '').trim().toLowerCase()
      return songTitle === normalizedTitle && songArtist === normalizedArtist
    })
    if (duplicate) {
      const confirmAdd = window.confirm(
        'A song with this title and artist already exists. Add another anyway?'
      )
      if (!confirmAdd) {
        setFormError('Duplicate song detected. Not added.')
        return
      }
    }

    // Optimistic UI update
    const tempSong: Song = {
      id: crypto.randomUUID(),
      title,
      artist,
      status,
      isPending: true
    }
    setSongs(prev => [...prev, tempSong])

    const { data, error } = await supabase
      .from('songs')
      .insert([
        {
          user_id: session.user.id,
          title,
          artist,
          status
        }
      ])
      .select()
      .single()

    if (error) {
      console.log('Error adding song:', error)
      setFormError('Could not add song. Please try again.')
      // rollback optimistic update
      setSongs(prev => prev.filter(song => song.id !== tempSong.id))
    }

    if (data) {
      setSongs(prev => prev.map(song => (song.id === tempSong.id ? (data as Song) : song)))
    }

    if (data && selectedGenreIds.length > 0) {
      const { error: genreError } = await supabase.from('song_genres').insert(
        selectedGenreIds.map(genreId => ({
          song_id: (data as Song).id,
          genre_id: genreId,
          user_id: session.user.id
        }))
      )
      if (genreError) {
        console.log('Error adding song genres:', genreError)
        setFormError('Song added, but genres failed to save.')
      }
    }

    setTitle('')
    setArtist('')
    setStatus('learning')
    setSelectedGenreIds([])
  }

  const finalizeDelete = async (id: string) => {
    if (!session) return
    const { data: files, error: filesError } = await supabase
      .from('song_files')
      .select('storage_path, file_url')
      .eq('song_id', id)
      .eq('user_id', session.user.id)

    if (filesError) console.log('Error fetching files for deletion:', filesError)

    if (files && files.length > 0) {
      const paths = files
        .map(file => file.storage_path ?? (file.file_url?.match(/\/song-pdfs\/(.+)$/)?.[1] ?? null))
        .filter((path): path is string => Boolean(path))
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('song-pdfs').remove(paths)
        if (storageError) console.log('Error deleting storage files:', storageError)
      }
    }

    const { data: audioFiles, error: audioFilesError } = await supabase
      .from('song_recordings')
      .select('storage_path, file_url')
      .eq('song_id', id)
      .eq('user_id', session.user.id)

    if (audioFilesError) console.log('Error fetching recordings for deletion:', audioFilesError)

    if (audioFiles && audioFiles.length > 0) {
      const paths = audioFiles
        .map(file => file.storage_path ?? (file.file_url?.match(/\/song-audio\/(.+)$/)?.[1] ?? null))
        .filter((path): path is string => Boolean(path))
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('song-audio').remove(paths)
        if (storageError) console.log('Error deleting recording files:', storageError)
      }
    }

    const { error } = await supabase.from('songs').delete().eq('id', id)
    if (error) console.log(error)
  }

  // Delete song with undo
  const handleDelete = async (id: string) => {
    if (!session) return
    const confirmDelete = window.confirm('Delete this song and all its files?')
    if (!confirmDelete) return

    if (undoDelete) {
      clearTimeout(undoDelete.timeoutId)
      await finalizeDelete(undoDelete.song.id)
      setUndoDelete(null)
    }

    const songIndex = songs.findIndex(song => song.id === id)
    const songToDelete = songs[songIndex]
    if (!songToDelete) return

    setSongs(prev => prev.filter(song => song.id !== id))

    const timeoutId = setTimeout(async () => {
      await finalizeDelete(id)
      setUndoDelete(null)
    }, 5000)

    setUndoDelete({ song: songToDelete, index: songIndex, timeoutId })
  }

  const handleUndoDelete = () => {
    if (!undoDelete) return
    clearTimeout(undoDelete.timeoutId)
    setSongs(prev => {
      const next = [...prev]
      next.splice(undoDelete.index, 0, undoDelete.song)
      return next
    })
    setUndoDelete(null)
  }

  // Navigate to song detail page
  const goToSong = (id: string) => {
    window.location.href = `/songs/${id}`
  }

  const artistOptions = Array.from(
    new Set(
      songs
        .map(song => (song.artist || '').trim())
        .filter(name => name.length > 0)
        .map(name => name.toLowerCase())
    )
  )
    .map(lower => songs.find(s => s.artist?.toLowerCase() === lower)?.artist || lower)
    .sort((a, b) => a.localeCompare(b))

  const filteredSongs = songs.filter(song => {
    if (filterStatus !== 'all' && song.status !== filterStatus) return false
    if (filterGenreId !== 'all') {
      const genreMatch = (song.song_genres || []).some(g => g.genre_id === filterGenreId)
      if (!genreMatch) return false
    }
    if (filterArtist !== 'all') {
      const artistMatch = (song.artist || '').trim().toLowerCase() === filterArtist.toLowerCase()
      if (!artistMatch) return false
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase()
      const titleMatch = song.title?.toLowerCase().includes(q)
      const artistMatch = song.artist?.toLowerCase().includes(q)
      if (!titleMatch && !artistMatch) return false
    }
    return true
  })

  return (
    <div className="page">
      {showOnboarding && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="label mb-2">Welcome</p>
                <h2 className="text-2xl font-semibold mb-2">Your library starts here</h2>
                <p className="muted">
                  Add a few songs, tag them with genres, and build your first setlist.
                </p>
              </div>
              <button type="button" className="button-ghost modal-close" onClick={dismissOnboarding}>
                Close
              </button>
            </div>
            <div className="grid gap-3">
              <div className="card-strong p-4">
                <p className="label mb-1">1. Add a song</p>
                <p className="text-sm muted">Use the form on this page to add your first song.</p>
              </div>
              <div className="card-strong p-4">
                <p className="label mb-1">2. Tag it</p>
                <p className="text-sm muted">Create a genre and assign it for quick filtering.</p>
              </div>
              <div className="card-strong p-4">
                <p className="label mb-1">3. Build a setlist</p>
                <p className="text-sm muted">Create a setlist and drag songs onto it.</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" className="button-primary" onClick={dismissOnboarding}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="page-header">
        <h1 className="text-3xl font-semibold tracking-tight">Your Songs</h1>
        <button
          type="button"
          className="button-primary button-cta"
          onClick={() => document.getElementById('add-song')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Add Song
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search title or artist..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input md:col-span-2"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input md:col-span-1"
          >
            <option value="all">All statuses</option>
            <option value="known">Known</option>
            <option value="learning">Learning</option>
            <option value="wishlist">Wishlist</option>
          </select>
          <select
            value={filterGenreId}
            onChange={e => setFilterGenreId(e.target.value)}
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
            onChange={e => setFilterArtist(e.target.value)}
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
          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('all')
              setFilterGenreId('all')
              setFilterArtist('all')
            }}
            className="text-sm button-subtle"
          >
            Clear filters
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : songs.length === 0 ? (
        <div className="card p-6 text-center">
          <h2 className="text-xl font-semibold">Start by adding your first song</h2>
          <p className="muted mt-2">
            Try something like “Wish You Were Here” — Pink Floyd.
          </p>
          <div className="mt-4 mx-auto max-w-sm border border-dashed border-[var(--border)] rounded-lg p-4 text-left">
            <p className="label mb-2">Sample</p>
            <p className="font-semibold">Wish You Were Here</p>
            <p className="muted">Pink Floyd</p>
            <span className="badge mt-2">Learning</span>
          </div>
        </div>
      ) : filteredSongs.length > 0 ? (
        <ul className="space-y-2">
          {filteredSongs.map(song => (
            <li
              key={song.id}
              draggable
              onDragStart={() => handleDragStart(song.id)}
              onDragEnd={handleDragEnd}
              onClick={() => goToSong(song.id)}
              className="row row-clickable flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-semibold text-lg">{song.title}</h2>
                  <span className="badge">{song.status}</span>
                </div>
                <p className="muted">{song.artist || 'Unknown Artist'}</p>
                {(song.song_genres || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(song.song_genres || []).map(g => (
                      <span key={g.genre_id} className="badge">
                        {g.genres?.name ?? 'Unknown'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center muted mt-4">No songs match your filters.</p>
      )}

      {/* Add Song Form */}
      <div id="add-song" className="section-title mt-12">
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <h2 className="text-xl font-semibold">Add a New Song</h2>
      </div>
      <div className="section-divider" />
      <form onSubmit={handleAddSong} className="flex flex-col gap-3 card p-4">
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <input
          type="text"
          placeholder="Song Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="input"
        />
        <input
          type="text"
          placeholder="Artist (optional)"
          value={artist}
          onChange={e => setArtist(e.target.value)}
          className="input"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="input"
        >
          <option value="known">Known</option>
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
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a genre (e.g. Jazz)"
            value={newGenreName}
            onChange={e => setNewGenreName(e.target.value)}
            className="input flex-1"
          />
          <button
            type="button"
            onClick={handleAddGenre}
            className="button-ghost"
          >
            Add Genre
          </button>
        </div>
        <button
          type="submit"
          className="button-primary mt-2"
        >
          Add Song
        </button>
      </form>

      {/* Setlists */}
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
        <form onSubmit={handleAddSetlist} className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="New setlist name"
            value={newSetlistName}
            onChange={e => setNewSetlistName(e.target.value)}
            className="input flex-1"
          />
          <button
            type="submit"
            className="button-ghost"
          >
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
                onDragOver={e => e.preventDefault()}
                onDragEnter={() => setDragOverSetlistId(setlist.id)}
                onDragLeave={() => setDragOverSetlistId(null)}
                onDrop={() => handleDropOnSetlist(setlist.id)}
                onClick={() => router.push(`/setlists/${setlist.id}`)}
                className={`row row-clickable flex justify-between items-center ${dragOverSetlistId === setlist.id ? 'row-selected' : ''}`}
              >
                <span>{setlist.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {undoDelete && (
        <div className="fixed bottom-4 right-4 card-strong px-4 py-3 shadow-lg flex items-center gap-3">
          <span className="text-sm">Song deleted.</span>
          <button
            onClick={handleUndoDelete}
            className="text-sm font-semibold button-link"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
