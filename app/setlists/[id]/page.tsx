'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import NoteContent from '../../components/NoteContent'
import NoteEditor from '../../components/NoteEditor'

interface Song {
  id: string
  title: string
  artist: string
  status: string
}

interface SetlistSongRow {
  song_id: string
  position: number | null
  songs: Song | null
}

interface SetlistNote {
  id: string
  content: string
  created_at: string
}

export default function SetlistDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [setlistName, setSetlistName] = useState('')
  const [setlistItems, setSetlistItems] = useState<SetlistSongRow[]>([])
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [selectedSongId, setSelectedSongId] = useState('')
  const [newSongTitle, setNewSongTitle] = useState('')
  const [newSongArtist, setNewSongArtist] = useState('')
  const [songAddError, setSongAddError] = useState('')
  const [notes, setNotes] = useState<SetlistNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [openSetlistMenu, setOpenSetlistMenu] = useState(false)
  const [openSongMenuId, setOpenSongMenuId] = useState<string | null>(null)
  const [openNoteMenuId, setOpenNoteMenuId] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    fetchSession()
  }, [])

  useEffect(() => {
    if (!id || !session?.user?.id) return

    const fetchSetlist = async () => {
      setLoading(true)
      setError('')

      const { data: setlistData, error: setlistError } = await supabase
        .from('setlists')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single()

      if (setlistError || !setlistData) {
        setError('Could not load setlist.')
        setLoading(false)
        return
      }

      const { data: setlistSongsData, error: setlistSongsError } = await supabase
        .from('setlist_songs')
        .select('song_id, position, songs(*)')
        .eq('setlist_id', id)
        .eq('user_id', session.user.id)
        .order('position', { ascending: true, nullsFirst: false })

      if (setlistSongsError) {
        console.error('Error loading setlist songs:', setlistSongsError)
      }

      const rawItems = ((setlistSongsData as SetlistSongRow[]) || []).filter(row => row.songs)
      const normalizedItems = rawItems
        .map((row, index) => ({ ...row, position: row.position ?? index }))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('title', { ascending: true })

      if (songsError) {
        console.error('Error loading songs:', songsError)
      }

      const { data: setlistNotesData, error: setlistNotesError } = await supabase
        .from('setlist_notes')
        .select('*')
        .eq('setlist_id', id)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (setlistNotesError) {
        console.error('Error loading setlist notes:', setlistNotesError)
      }

      setSetlistName(setlistData.name)
      setSetlistItems(normalizedItems)
      setAllSongs((songsData as Song[]) || [])
      setNotes((setlistNotesData as SetlistNote[]) || [])
      setLoading(false)
    }

    fetchSetlist()
  }, [id, session])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.menu-container')) return
      setOpenSetlistMenu(false)
      setOpenSongMenuId(null)
      setOpenNoteMenuId(null)
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [])

  const handleRemoveSong = async (songId: string) => {
    if (!session?.user?.id) return
    const { error } = await supabase
      .from('setlist_songs')
      .delete()
      .eq('setlist_id', id)
      .eq('song_id', songId)
      .eq('user_id', session.user.id)
    if (error) {
      console.error('Error removing song from setlist:', error)
      return
    }
    setSetlistItems(prev => prev.filter(item => item.song_id !== songId))
  }

  const getNextPosition = async () => {
    if (!session?.user?.id) return 0
    const { data } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', id)
      .eq('user_id', session.user.id)
      .order('position', { ascending: false })
      .limit(1)
    return (data?.[0]?.position ?? -1) + 1
  }

  const handleAddExistingSong = async () => {
    if (!session?.user?.id) return
    setSongAddError('')
    if (!selectedSongId) {
      setSongAddError('Choose a song to add.')
      return
    }
    if (setlistItems.some(item => item.song_id === selectedSongId)) {
      setSongAddError('That song is already in this setlist.')
      return
    }
    const nextPosition = await getNextPosition()
    const { error } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: id,
        song_id: selectedSongId,
        user_id: session.user.id,
        position: nextPosition
      })
    if (error) {
      console.error('Error adding song to setlist:', error)
      setSongAddError('Could not add song. Please try again.')
      return
    }
    const song = allSongs.find(item => item.id === selectedSongId) || null
    setSetlistItems(prev =>
      [...prev, { song_id: selectedSongId, position: nextPosition, songs: song }].filter(item => item.songs)
    )
    setSelectedSongId('')
  }

  const handleCreateSongAndAdd = async () => {
    if (!session?.user?.id) return
    const title = newSongTitle.trim()
    if (!title) {
      setSongAddError('Enter a song title.')
      return
    }
    setSongAddError('')
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .insert({
        title,
        artist: newSongArtist.trim() || null,
        status: 'learning',
        user_id: session.user.id
      })
      .select()
      .single()
    if (songError || !songData) {
      console.error('Error creating song:', songError)
      setSongAddError('Could not create song. Please try again.')
      return
    }
    const nextPosition = await getNextPosition()
    const { error: setlistError } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: id,
        song_id: songData.id,
        user_id: session.user.id,
        position: nextPosition
      })
    if (setlistError) {
      console.error('Error adding new song to setlist:', setlistError)
      setSongAddError('Song created, but could not add to setlist.')
      return
    }
    setAllSongs(prev => [...prev, songData as Song].sort((a, b) => a.title.localeCompare(b.title)))
    setSetlistItems(prev => [...prev, { song_id: songData.id, position: nextPosition, songs: songData as Song }])
    setNewSongTitle('')
    setNewSongArtist('')
  }

  const handleAddNote = async () => {
    const temp = document.createElement('div')
    temp.innerHTML = newNote
    if (!temp.textContent?.trim() || !session?.user?.id) return
    const { data, error } = await supabase
      .from('setlist_notes')
      .insert({ setlist_id: id, user_id: session.user.id, content: newNote.trim() })
      .select()
      .single()
    if (error) {
      console.error('Error adding setlist note:', error)
      return
    }
    if (data) {
      setNotes(prev => [data as SetlistNote, ...prev])
      setNewNote('')
    }
  }

  const handleEditNote = (note: SetlistNote) => {
    setEditingNoteId(note.id)
    setEditingNoteContent(note.content)
  }

  const handleUpdateNote = async () => {
    const temp = document.createElement('div')
    temp.innerHTML = editingNoteContent
    if (!editingNoteId || !temp.textContent?.trim() || !session?.user?.id) return
    const { data, error } = await supabase
      .from('setlist_notes')
      .update({ content: editingNoteContent.trim() })
      .eq('id', editingNoteId)
      .eq('user_id', session.user.id)
      .select()
      .single()
    if (error) {
      console.error('Error updating setlist note:', error)
      return
    }
    if (data) {
      setNotes(prev => prev.map(n => (n.id === data.id ? (data as SetlistNote) : n)))
      setEditingNoteId(null)
      setEditingNoteContent('')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!session?.user?.id) return
    const { error } = await supabase
      .from('setlist_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', session.user.id)
    if (error) {
      console.error('Error deleting setlist note:', error)
      return
    }
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const handleDeleteSetlist = async () => {
    if (!session?.user?.id) return
    const confirmDelete = window.confirm('Delete this setlist?')
    if (!confirmDelete) return
    const { error } = await supabase
      .from('setlists')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
    if (error) {
      console.error('Error deleting setlist:', error)
      return
    }
    router.push('/setlists')
  }

  const handleRenameSetlist = async () => {
    if (!session?.user?.id) return
    const nextName = window.prompt('Rename setlist', setlistName)
    if (!nextName) return
    const trimmed = nextName.trim()
    if (!trimmed || trimmed === setlistName) return
    const { data, error } = await supabase
      .from('setlists')
      .update({ name: trimmed })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()
    if (error) {
      console.error('Error renaming setlist:', error)
      return
    }
    if (data) setSetlistName(data.name)
  }

  const persistOrder = async (items: SetlistSongRow[]) => {
    if (!session?.user?.id) return
    setSavingOrder(true)
    try {
      await Promise.all(
        items.map((item, index) =>
          supabase
            .from('setlist_songs')
            .update({ position: index })
            .eq('setlist_id', id)
            .eq('song_id', item.song_id)
            .eq('user_id', session.user.id)
        )
      )
    } catch (err) {
      console.error('Error saving order:', err)
    } finally {
      setSavingOrder(false)
    }
  }

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return
    const updated = [...setlistItems]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(dropIndex, 0, moved)
    setSetlistItems(updated)
    setDragIndex(null)
    setDragOverIndex(null)
    persistOrder(updated)
  }

  if (loading) return <p className="page">Loading...</p>
  if (error) return <p className="page text-red-600">{error}</p>

  return (
    <div className="page">
      <div className="mb-4">
        <button onClick={() => router.push('/songs')} className="button-link button-link-large">
          ← Back to Songs
        </button>
      </div>

      <div className="card p-6 mb-6 flex justify-between items-center">
        <div>
          <p className="label mb-2">Setlist</p>
          <h1 className="text-3xl font-semibold tracking-tight">{setlistName}</h1>
        </div>
        <div className="menu-container" onClick={event => event.stopPropagation()}>
          <button
            type="button"
            className="button-ghost menu-trigger"
            onClick={event => {
              event.stopPropagation()
              setOpenSetlistMenu(prev => !prev)
            }}
          >
            <span className="menu-dots" aria-hidden="true">⋯</span>
            <span className="sr-only">Setlist actions</span>
          </button>
          {openSetlistMenu && (
            <div className="menu" onClick={event => event.stopPropagation()}>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  handleRenameSetlist()
                  setOpenSetlistMenu(false)
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="menu-item menu-danger"
                onClick={() => {
                  handleDeleteSetlist()
                  setOpenSetlistMenu(false)
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path
              d="M7 6h10M7 12h10M7 18h6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Add Songs</h2>
        </div>
        <div className="section-divider" />
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <span className="label w-32 text-base">From library:</span>
            <select
              value={selectedSongId}
              onChange={event => setSelectedSongId(event.target.value)}
              className="input flex-1"
            >
              <option value="">Choose song…</option>
              {allSongs
                .filter(song => !setlistItems.some(item => item.song_id === song.id))
                .map(song => (
                  <option key={song.id} value={song.id}>
                    {song.title}
                  </option>
                ))}
            </select>
            <button onClick={handleAddExistingSong} className="button-primary">
              Add
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="label w-32 text-base">New song:</span>
            <input
              type="text"
              placeholder="Song title"
              value={newSongTitle}
              onChange={event => setNewSongTitle(event.target.value)}
              className="input flex-1"
            />
            <input
              type="text"
              placeholder="Artist (optional)"
              value={newSongArtist}
              onChange={event => setNewSongArtist(event.target.value)}
              className="input flex-1"
            />
            <button onClick={handleCreateSongAndAdd} className="button-ghost">
              Create
            </button>
          </div>
        </div>
        {songAddError && <p className="text-sm text-red-600 mt-2">{songAddError}</p>}
      </div>

      {setlistItems.length === 0 ? (
        <p className="muted">No songs in this setlist yet.</p>
      ) : (
        <>
          {savingOrder && <p className="text-sm muted mb-2">Saving order...</p>}
          <div className="section-title">
            <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
              <path
                d="M7 6h10M7 12h10M7 18h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <h2 className="text-xl font-semibold">Songs</h2>
          </div>
          <div className="section-divider" />
          <ul className="space-y-2">
            {setlistItems.map((item, index) => (
              <li
                key={item.song_id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={e => e.preventDefault()}
                onDragEnter={() => setDragOverIndex(index)}
                onDragLeave={() => setDragOverIndex(null)}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                onDrop={() => handleDrop(index)}
                onClick={() => router.push(`/songs/${item.song_id}?fromSetlist=${id}`)}
                className={`row flex justify-between items-center ${dragOverIndex === index ? 'row-selected' : ''} ${openSongMenuId === item.song_id ? 'row-menu-open' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="mono text-sm muted w-6 text-right">{index + 1}.</span>
                  <div>
                    <p className="font-medium">{item.songs?.title}</p>
                    <p className="text-sm muted">{item.songs?.artist || 'Unknown Artist'}</p>
                  </div>
                </div>
                <div className="menu-container" onClick={event => event.stopPropagation()}>
                  <button
                    type="button"
                    className="button-ghost menu-trigger"
                    onClick={event => {
                      event.stopPropagation()
                      setOpenSongMenuId(prev => (prev === item.song_id ? null : item.song_id))
                    }}
                  >
                    <span className="menu-dots" aria-hidden="true">⋯</span>
                    <span className="sr-only">Song actions</span>
                  </button>
                  {openSongMenuId === item.song_id && (
                    <div className="menu" onClick={event => event.stopPropagation()}>
                      <button
                        type="button"
                        className="menu-item menu-danger"
                        onClick={() => {
                          handleRemoveSong(item.song_id)
                          setOpenSongMenuId(null)
                        }}
                      >
                        Remove from setlist
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="card p-6 mt-6">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path
              d="M6 5h12v14H6z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9 9h6M9 13h6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Setlist Notes</h2>
        </div>
        <div className="section-divider" />
        <NoteEditor
          value={newNote}
          onChange={setNewNote}
          placeholder="Add a note about this setlist..."
          className="input note-editor w-full mb-2 min-h-[100px]"
        />
        <button
          onClick={handleAddNote}
          className="button-primary mb-6"
        >
          Save Note
        </button>
        {notes.length === 0 ? (
          <p className="muted">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map(note => (
              <li
                key={note.id}
                className={`row flex justify-between items-start ${openNoteMenuId === note.id ? 'row-menu-open' : ''}`}
              >
                {editingNoteId === note.id ? (
                  <div className="w-full">
                    <NoteEditor
                      value={editingNoteContent}
                      onChange={setEditingNoteContent}
                      placeholder="Edit note..."
                      className="input note-editor w-full mb-2 min-h-[100px]"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateNote}
                        className="button-primary"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(null)
                          setEditingNoteContent('')
                        }}
                        className="button-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="note-content flex-1">
                      <NoteContent text={note.content} />
                    </div>
                    <div className="menu-container" onClick={event => event.stopPropagation()}>
                      <button
                        type="button"
                        className="button-ghost menu-trigger"
                        onClick={event => {
                          event.stopPropagation()
                          setOpenNoteMenuId(prev => (prev === note.id ? null : note.id))
                        }}
                      >
                        <span className="menu-dots" aria-hidden="true">⋯</span>
                        <span className="sr-only">Note actions</span>
                      </button>
                      {openNoteMenuId === note.id && (
                        <div className="menu" onClick={event => event.stopPropagation()}>
                          <button
                            type="button"
                            className="menu-item"
                            onClick={() => {
                              handleEditNote(note)
                              setOpenNoteMenuId(null)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="menu-item menu-danger"
                            onClick={() => {
                              handleDeleteNote(note.id)
                              setOpenNoteMenuId(null)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
