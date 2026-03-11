'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import { useSupabaseSession } from '../../components/SessionProvider'
import SetlistHeader from '../../components/setlist-detail/SetlistHeader'
import SetlistNotesSection from '../../components/setlist-detail/SetlistNotesSection'
import SetlistSongsSection from '../../components/setlist-detail/SetlistSongsSection'
import type { SetlistNote, SetlistSongRow, Song } from '../../components/setlist-detail/types'

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
  const [error, setError] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [openSetlistMenu, setOpenSetlistMenu] = useState(false)
  const [openSongMenuId, setOpenSongMenuId] = useState<string | null>(null)
  const [openNoteMenuId, setOpenNoteMenuId] = useState<string | null>(null)
  const { session } = useSupabaseSession()

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

      const rawItems = ((setlistSongsData as unknown as SetlistSongRow[]) || []).filter(row => row.songs)
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
      <SetlistHeader
        openSetlistMenu={openSetlistMenu}
        onBack={() => router.push('/songs')}
        onDelete={handleDeleteSetlist}
        onRename={handleRenameSetlist}
        setOpenSetlistMenu={updater => setOpenSetlistMenu(prev => updater(prev))}
        setlistName={setlistName}
      />

      <SetlistSongsSection
        allSongs={allSongs}
        dragOverIndex={dragOverIndex}
        newSongArtist={newSongArtist}
        newSongTitle={newSongTitle}
        onAddExistingSong={handleAddExistingSong}
        onCreateSongAndAdd={handleCreateSongAndAdd}
        onDrop={handleDrop}
        onRemoveSong={handleRemoveSong}
        onSongClick={songId => router.push(`/songs/${songId}?fromSetlist=${id}`)}
        openSongMenuId={openSongMenuId}
        savingOrder={savingOrder}
        selectedSongId={selectedSongId}
        setDragIndex={setDragIndex}
        setDragOverIndex={setDragOverIndex}
        setNewSongArtist={setNewSongArtist}
        setNewSongTitle={setNewSongTitle}
        setOpenSongMenuId={updater => setOpenSongMenuId(prev => updater(prev))}
        setSelectedSongId={setSelectedSongId}
        setlistItems={setlistItems}
        songAddError={songAddError}
      />

      <SetlistNotesSection
        editingNoteContent={editingNoteContent}
        editingNoteId={editingNoteId}
        newNote={newNote}
        notes={notes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onEditNote={handleEditNote}
        onUpdateNote={handleUpdateNote}
        openNoteMenuId={openNoteMenuId}
        setEditingNoteContent={setEditingNoteContent}
        setEditingNoteId={setEditingNoteId}
        setNewNote={setNewNote}
        setOpenNoteMenuId={updater => setOpenNoteMenuId(prev => updater(prev))}
      />
    </div>
  )
}
