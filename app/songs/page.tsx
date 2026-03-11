'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import AddSongModal from '../components/songs-page/AddSongModal'
import OnboardingModal from '../components/songs-page/OnboardingModal'
import SetlistsSection from '../components/songs-page/SetlistsSection'
import SongsContent from '../components/songs-page/SongsContent'
import SongsToolbar from '../components/songs-page/SongsToolbar'
import type { Genre, Setlist, Song, SongGenre, SongsViewMode } from '../components/songs-page/types'
import UndoDeleteToast from '../components/songs-page/UndoDeleteToast'
import { useSupabaseSession } from '../components/SessionProvider'

export default function SongsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [status, setStatus] = useState('')
  const [genres, setGenres] = useState<Genre[]>([])
  const [newGenreName, setNewGenreName] = useState('')
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([])
  const [genreLimitError, setGenreLimitError] = useState('')
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
  const [openMenuSongId, setOpenMenuSongId] = useState<string | null>(null)
  const [undoDelete, setUndoDelete] = useState<{
    song: Song
    index: number
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('gt_onboarded') !== '1'
  })
  const [showAddSongModal, setShowAddSongModal] = useState(false)
  const [songsViewMode, setSongsViewMode] = useState<SongsViewMode>(() => {
    if (typeof window === 'undefined') return 'board'
    return window.localStorage.getItem('songs-view-mode') === 'list' ? 'list' : 'board'
  })
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const { session } = useSupabaseSession()

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
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.menu-container')) return
      setOpenMenuSongId(null)
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [])

  useEffect(() => {
    if (searchParams.get('add') !== '1') return
    const timeoutId = window.setTimeout(() => {
      setFormError('')
      setShowAddSongModal(true)
    }, 0)

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('add')
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)

    return () => window.clearTimeout(timeoutId)
  }, [searchParams, pathname, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('songs-view-mode', songsViewMode)
  }, [songsViewMode])

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
      setSelectedGenreIds(prev => {
        if (prev.includes((data as Genre).id)) return prev
        if (prev.length >= 3) {
          setGenreLimitError('Maximum 3 genres allowed.')
          return prev
        }
        setGenreLimitError('')
        return [...prev, (data as Genre).id]
      })
      setNewGenreName('')
    }
  }

  const toggleGenre = (genreId: string) => {
    setSelectedGenreIds(prev => {
      if (prev.includes(genreId)) {
        setGenreLimitError('')
        return prev.filter(id => id !== genreId)
      }
      if (prev.length >= 3) {
        setGenreLimitError('Maximum 3 genres allowed.')
        return prev
      }
      setGenreLimitError('')
      return [...prev, genreId]
    })
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

  const updateSongStatus = async (
    songId: string,
    nextStatus: 'confident' | 'learning' | 'wishlist'
  ) => {
    setSongs(prev => prev.map(song => (song.id === songId ? { ...song, status: nextStatus } : song)))
    const { error } = await supabase.from('songs').update({ status: nextStatus }).eq('id', songId)
    if (error) {
      console.log('Error updating song status:', error)
    }
  }

  // Add new song (Optimistic Update)
  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return false
    setFormError('')
    if (!status) {
      setFormError('Please choose a status.')
      return false
    }

    const normalizedTitle = title.trim().toLowerCase()
    const normalizedArtist = artist.trim().toLowerCase()
    const genreIdsForNewSong = [...selectedGenreIds]
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
        return false
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

    let hasInsertError = false
    if (error) {
      console.log('Error adding song:', error)
      setFormError('Could not add song. Please try again.')
      hasInsertError = true
      // rollback optimistic update
      setSongs(prev => prev.filter(song => song.id !== tempSong.id))
    }

    if (data) {
      setSongs(prev => prev.map(song => (song.id === tempSong.id ? (data as Song) : song)))
    }

    let hasGenreError = false
    if (data && genreIdsForNewSong.length > 0) {
      const { error: genreError } = await supabase.from('song_genres').insert(
        genreIdsForNewSong.map(genreId => ({
          song_id: (data as Song).id,
          genre_id: genreId,
          user_id: session.user.id
        }))
      )
      if (genreError) {
        console.log('Error adding song genres:', genreError)
        setFormError('Song added, but genres failed to save.')
        hasGenreError = true
      } else {
        // Keep newly-added tile in sync without requiring a refetch.
        const hydratedGenres: SongGenre[] = genreIdsForNewSong.map(genreId => ({
          genre_id: genreId,
          genres: {
            name: genres.find(g => g.id === genreId)?.name ?? 'Unknown'
          }
        }))
        setSongs(prev =>
          prev.map(song =>
            song.id === (data as Song).id ? { ...song, song_genres: hydratedGenres } : song
          )
        )
      }
    }

    setTitle('')
    setArtist('')
    setStatus('')
    setSelectedGenreIds([])
    setGenreLimitError('')
    return Boolean(data) && !hasInsertError && !hasGenreError
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
    router.push(`/songs/${id}`)
  }

  const artistOptions = useMemo(
    () =>
      Array.from(
        new Set(
          songs
            .map(song => (song.artist || '').trim())
            .filter(name => name.length > 0)
            .map(name => name.toLowerCase())
        )
      )
        .map(lower => songs.find(s => s.artist?.toLowerCase() === lower)?.artist || lower)
        .sort((a, b) => a.localeCompare(b)),
    [songs]
  )

  const filteredSongs = useMemo(() => {
    const normalizedArtistFilter = filterArtist.toLowerCase()
    const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase()

    return songs.filter(song => {
      if (filterStatus !== 'all' && song.status !== filterStatus) return false
      if (filterGenreId !== 'all') {
        const genreMatch = (song.song_genres || []).some(g => g.genre_id === filterGenreId)
        if (!genreMatch) return false
      }
      if (filterArtist !== 'all') {
        const artistMatch = (song.artist || '').trim().toLowerCase() === normalizedArtistFilter
        if (!artistMatch) return false
      }
      if (normalizedSearchTerm) {
        const titleMatch = song.title?.toLowerCase().includes(normalizedSearchTerm)
        const artistMatch = song.artist?.toLowerCase().includes(normalizedSearchTerm)
        if (!titleMatch && !artistMatch) return false
      }
      return true
    })
  }, [deferredSearchTerm, filterArtist, filterGenreId, filterStatus, songs])

  const songsByStatus = useMemo(
    () => ({
      confident: filteredSongs.filter(song => song.status === 'confident'),
      learning: filteredSongs.filter(song => song.status === 'learning'),
      wishlist: filteredSongs.filter(song => song.status === 'wishlist')
    }),
    [filteredSongs]
  )

  const statusGroups = useMemo(
    () => [
      {
        key: 'confident' as const,
        title: 'Confident',
        songs: songsByStatus.confident,
        emptyCopy: 'Nothing here yet.',
        statusClass: 'status-confident'
      },
      {
        key: 'learning' as const,
        title: 'Learning',
        songs: songsByStatus.learning,
        emptyCopy: 'Add something you’re working on.',
        statusClass: 'status-learning'
      },
      {
        key: 'wishlist' as const,
        title: 'Wishlist',
        songs: songsByStatus.wishlist,
        emptyCopy: 'Capture songs you want to learn.',
        statusClass: 'status-wishlist'
      }
    ],
    [songsByStatus]
  )

  return (
    <div className="page">
      {session && showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}

      <SongsToolbar
        artistOptions={artistOptions}
        filterArtist={filterArtist}
        filterGenreId={filterGenreId}
        filterStatus={filterStatus}
        genres={genres}
        onAddSong={() => {
          setFormError('')
          setShowAddSongModal(true)
        }}
        onClearFilters={() => {
          setSearchTerm('')
          setFilterStatus('all')
          setFilterGenreId('all')
          setFilterArtist('all')
        }}
        searchTerm={searchTerm}
        setFilterArtist={setFilterArtist}
        setFilterGenreId={setFilterGenreId}
        setFilterStatus={setFilterStatus}
        setSearchTerm={setSearchTerm}
        setSongsViewMode={setSongsViewMode}
        songsViewMode={songsViewMode}
      />

      <SongsContent
        filteredSongs={filteredSongs}
        loading={loading}
        onDelete={songId => {
          void handleDelete(songId)
        }}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onGoToSong={goToSong}
        onToggleMenu={songId => setOpenMenuSongId(prev => (prev === songId ? null : songId))}
        onUpdateStatus={updateSongStatus}
        openMenuSongId={openMenuSongId}
        setOpenMenuSongId={setOpenMenuSongId}
        songs={songs}
        songsViewMode={songsViewMode}
        statusGroups={statusGroups}
      />

      {showAddSongModal && (
        <AddSongModal
          artist={artist}
          formError={formError}
          genreLimitError={genreLimitError}
          genres={genres}
          newGenreName={newGenreName}
          onAddGenre={() => {
            void handleAddGenre({ preventDefault() {} } as React.FormEvent)
          }}
          onClose={() => setShowAddSongModal(false)}
          onSubmit={async event => {
            const success = await handleAddSong(event)
            if (success) setShowAddSongModal(false)
          }}
          selectedGenreIds={selectedGenreIds}
          setArtist={setArtist}
          setNewGenreName={setNewGenreName}
          setStatus={setStatus}
          setTitle={setTitle}
          status={status}
          title={title}
          toggleGenre={toggleGenre}
        />
      )}

      <SetlistsSection
        dragOverSetlistId={dragOverSetlistId}
        newSetlistName={newSetlistName}
        onAddSetlist={handleAddSetlist}
        onDropOnSetlist={setlistId => {
          void handleDropOnSetlist(setlistId)
        }}
        onOpenSetlist={setlistId => router.push(`/setlists/${setlistId}`)}
        setDragOverSetlistId={setDragOverSetlistId}
        setNewSetlistName={setNewSetlistName}
        setlistError={setlistError}
        setlists={setlists}
      />

      {undoDelete && <UndoDeleteToast onUndo={handleUndoDelete} />}
    </div>
  )
}
