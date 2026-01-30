'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

interface Song {
  id: string
  title: string
  artist: string
  status: string
}

interface Note {
  id: string
  content: string
  created_at: string
}

interface SongLink {
  id: string
  title: string | null
  url: string
}

interface SongFile {
  id: string
  file_name: string
  file_url: string
  storage_path?: string
}

interface SongGenre {
  genre_id: string
  genres: {
    name: string
  } | null
}

interface Genre {
  id: string
  name: string
}

interface Setlist {
  id: string
  name: string
}

const getYouTubeEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.slice(1)
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
  } catch {
    return null
  }
  return null
}

export default function SongDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSetlistId = searchParams.get('fromSetlist')

  const [song, setSong] = useState<Song | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [links, setLinks] = useState<SongLink[]>([])
  const [pdfFiles, setPdfFiles] = useState<SongFile[]>([])
  const [songGenres, setSongGenres] = useState<SongGenre[]>([])
  const [allGenres, setAllGenres] = useState<Genre[]>([])
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [songSetlistIds, setSongSetlistIds] = useState<string[]>([])

  const [newNote, setNewNote] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editArtist, setEditArtist] = useState('')
  const [editStatus, setEditStatus] = useState('learning')
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([])
  const [savingSong, setSavingSong] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editingLinkTitle, setEditingLinkTitle] = useState('')
  const [editingLinkUrl, setEditingLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const [newSetlistName, setNewSetlistName] = useState('')
  const [setlistError, setSetlistError] = useState('')
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [previewYoutubeUrl, setPreviewYoutubeUrl] = useState<string | null>(null)
  const [previewYoutubeTitle, setPreviewYoutubeTitle] = useState('')
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null)
  const [editingPdfName, setEditingPdfName] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [newGenreName, setNewGenreName] = useState('')
  const [genreError, setGenreError] = useState('')
  const [openLinkMenuId, setOpenLinkMenuId] = useState<string | null>(null)
  const [openPdfMenuId, setOpenPdfMenuId] = useState<string | null>(null)
  const [openNoteMenuId, setOpenNoteMenuId] = useState<string | null>(null)

  const [session, setSession] = useState<any>(null)
  const linkClickTimeouts = useRef<Record<string, number>>({})
  const pdfClickTimeouts = useRef<Record<string, number>>({})
  const skipLinkRowClickRef = useRef(false)
  const skipPdfRowClickRef = useRef(false)
  const pdfPreviewRef = useRef<HTMLDivElement | null>(null)
  const youtubePreviewRef = useRef<HTMLDivElement | null>(null)
  const [selectedSetlistId, setSelectedSetlistId] = useState<string>('')

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    loadSession()
  }, [])

  // Fetch all data
  useEffect(() => {
    if (!id || !session?.user?.id) return

    const fetchData = async () => {
      setLoadError('')
      // Songs
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single()
      if (songError || !songData) {
        setLoadError('Could not load song.')
        return
      }

      // Notes
      const { data: notesData } = await supabase
        .from('song_notes')
        .select('*')
        .eq('song_id', id)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      // Links
      const { data: linksData } = await supabase
        .from('song_links')
        .select('*')
        .eq('song_id', id)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      // PDFs
      const { data: pdfData } = await supabase
        .from('song_files')
        .select('*')
        .eq('song_id', id)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      // All Genres (for editing)
      const { data: allGenresData } = await supabase
        .from('genres')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true })

      // Setlists
      const { data: setlistsData } = await supabase
        .from('setlists')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true })

      const { data: songSetlistsData } = await supabase
        .from('setlist_songs')
        .select('setlist_id')
        .eq('song_id', id)
        .eq('user_id', session.user.id)

      // Genres
      const { data: genreData } = await supabase
        .from('song_genres')
        .select('genre_id, genres(name)')
        .eq('song_id', id)
        .eq('user_id', session.user.id)

      setSong(songData)
      setNotes(notesData || [])
      setLinks(linksData || [])
      setPdfFiles(pdfData || [])
      setSongGenres((genreData as SongGenre[]) || [])
      setAllGenres((allGenresData as Genre[]) || [])
      setSetlists((setlistsData as Setlist[]) || [])
      setSongSetlistIds(((songSetlistsData as { setlist_id: string }[]) || []).map(s => s.setlist_id))
      setEditTitle(songData.title || '')
      setEditArtist(songData.artist || '')
      setEditStatus(songData.status || 'learning')
      setSelectedGenreIds(((genreData as SongGenre[]) || []).map(g => g.genre_id))
    }

    fetchData()
  }, [id, session])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.menu-container')) return
      setOpenLinkMenuId(null)
      setOpenPdfMenuId(null)
      setOpenNoteMenuId(null)
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [])

  useEffect(() => {
    if (!previewPdfUrl) return
    const timeout = window.setTimeout(() => {
      pdfPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
    return () => window.clearTimeout(timeout)
  }, [previewPdfUrl])

  useEffect(() => {
    if (!previewYoutubeUrl) return
    const timeout = window.setTimeout(() => {
      youtubePreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
    return () => window.clearTimeout(timeout)
  }, [previewYoutubeUrl])

  // ---------- Notes ----------
  const handleAddNote = async () => {
    if (!newNote.trim() || !session?.user?.id) return

    const { data, error } = await supabase
      .from('song_notes')
      .insert({ song_id: id, user_id: session.user.id, content: newNote })
      .select()
      .single()

    if (error) return console.error('Error adding note:', error)
    if (data) {
      setNotes(prev => [data, ...prev])
      setNewNote('')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from('song_notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id)
    setEditingNoteContent(note.content)
  }

  const handleUpdateNote = async () => {
    if (!editingNoteId || !editingNoteContent.trim() || !session?.user?.id) return
    const { data, error } = await supabase
      .from('song_notes')
      .update({ content: editingNoteContent.trim(), updated_at: new Date().toISOString() })
      .eq('id', editingNoteId)
      .eq('user_id', session.user.id)
      .select()
      .single()
    if (error) return console.error('Error updating note:', error)
    if (data) {
      setNotes(prev => prev.map(n => (n.id === data.id ? (data as Note) : n)))
      setEditingNoteId(null)
      setEditingNoteContent('')
    }
  }

  // ---------- Links ----------
  const handleAddLink = async () => {
    if (!linkUrl.trim() || !session?.user?.id) return
    setLinkError('')
    let parsed: URL | null = null
    try {
      parsed = new URL(linkUrl.trim())
    } catch {
      parsed = null
    }
    if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
      setLinkError('Please enter a valid http(s) link.')
      return
    }

    const { data, error } = await supabase
      .from('song_links')
      .insert({ song_id: id, user_id: session.user.id, title: linkTitle || null, url: linkUrl })
      .select()
      .single()

    if (error) return console.error('Error adding link:', error)
    if (data) {
      setLinks(prev => [data, ...prev])
      setLinkTitle('')
      setLinkUrl('')
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    await supabase.from('song_links').delete().eq('id', linkId)
    setLinks(prev => prev.filter(l => l.id !== linkId))
  }

  const handleEditLink = (link: SongLink) => {
    setEditingLinkId(link.id)
    setEditingLinkTitle(link.title || '')
    setEditingLinkUrl(link.url)
  }

  const handleUpdateLink = async () => {
    if (!editingLinkId || !editingLinkUrl.trim() || !session?.user?.id) return
    setLinkError('')
    let parsed: URL | null = null
    try {
      parsed = new URL(editingLinkUrl.trim())
    } catch {
      parsed = null
    }
    if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
      setLinkError('Please enter a valid http(s) link.')
      return
    }
    const { error } = await supabase
      .from('song_links')
      .update({ title: editingLinkTitle.trim() || null, url: editingLinkUrl.trim() })
      .eq('id', editingLinkId)
      .eq('user_id', session.user.id)
    if (error) {
      console.error('Error updating link:', error)
      setLinkError('Unable to update link. Please try again.')
      return
    }
    setLinks(prev =>
      prev.map(l =>
        l.id === editingLinkId
          ? { ...l, title: editingLinkTitle.trim() || null, url: editingLinkUrl.trim() }
          : l
      )
    )
    setEditingLinkId(null)
    setEditingLinkTitle('')
    setEditingLinkUrl('')
  }

  const handleCancelLinkEdit = () => {
    setEditingLinkId(null)
    setEditingLinkTitle('')
    setEditingLinkUrl('')
    setLinkError('')
    skipLinkRowClickRef.current = true
    window.setTimeout(() => {
      skipLinkRowClickRef.current = false
    }, 0)
  }

  const handleOpenLink = (link: SongLink) => {
    const embedUrl = getYouTubeEmbedUrl(link.url)
    if (embedUrl) {
      setPreviewYoutubeUrl(prev => {
        const next = prev === embedUrl ? null : embedUrl
        setPreviewYoutubeTitle(next ? link.title || link.url : '')
        return next
      })
      return
    }
    setPreviewYoutubeUrl(null)
    setPreviewYoutubeTitle('')
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  const handleLinkRowClick = (link: SongLink) => {
    const embedUrl = getYouTubeEmbedUrl(link.url)
    if (!embedUrl) {
      window.open(link.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (linkClickTimeouts.current[link.id]) {
      window.clearTimeout(linkClickTimeouts.current[link.id])
    }
    linkClickTimeouts.current[link.id] = window.setTimeout(() => {
      handleOpenLink(link)
      delete linkClickTimeouts.current[link.id]
    }, 200)
  }

  const handleLinkRowDoubleClick = (link: SongLink) => {
    if (linkClickTimeouts.current[link.id]) {
      window.clearTimeout(linkClickTimeouts.current[link.id])
      delete linkClickTimeouts.current[link.id]
    }
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  // ---------- PDFs ----------
  const handleUploadPdf = async () => {
    if (!pdfFile) return console.error('No file selected')
    if (!session?.user?.id) return console.error('Session not loaded or user ID missing')

    setUploading(true)
    setUploadProgress(0)
    const userId = session.user.id
    const safeFileName = pdfFile.name
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${userId}/${Date.now()}_${safeFileName}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const encodedPath = filePath
      .split('/')
      .map(part => encodeURIComponent(part))
      .join('/')

    const uploadWithProgress = () =>
      new Promise<void>((resolve, reject) => {
        if (!supabaseUrl || !supabaseAnonKey || !session?.access_token) {
          reject(new Error('Missing Supabase config or access token'))
          return
        }
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${supabaseUrl}/storage/v1/object/song-pdfs/${encodedPath}`)
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.setRequestHeader('apikey', supabaseAnonKey)
        xhr.setRequestHeader('x-upsert', 'false')
        xhr.setRequestHeader('Content-Type', pdfFile.type || 'application/pdf')
        xhr.upload.onprogress = event => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percent)
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`))
        }
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.send(pdfFile)
      })

    try {
      await uploadWithProgress()
      setUploadProgress(100)
    } catch (err) {
      console.error('Storage upload error:', err)
      setUploading(false)
      setUploadProgress(0)
      return
    }

    // Get public URL
    const publicUrl = supabase.storage.from('song-pdfs').getPublicUrl(filePath).data?.publicUrl
    if (!publicUrl) {
      console.error('Could not get public URL')
      setUploading(false)
      setUploadProgress(0)
      return
    }

    // Insert into DB (RLS-safe)
    const { data: dbData, error: dbError } = await supabase
      .from('song_files')
      .insert({
        song_id: id,
        user_id: userId,
        file_name: pdfFile.name,
          file_url: publicUrl,
          storage_path: filePath
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error (RLS):', dbError)
      setUploading(false)
      setUploadProgress(0)
      return
    }

    setPdfFiles(prev => [dbData, ...prev])
    setPdfFile(null)
    setUploading(false)
    setUploadProgress(0)
  }

  const handleDeletePdf = async (fileId: string) => {
    try {
      const file = pdfFiles.find(f => f.id === fileId)
      if (!file) {
        console.error('File not found for deletion:', fileId)
        return
      }

      // Prefer an explicit `storage_path` recorded in the DB. Fall back to
      // parsing the public URL if it isn't available.
      const storagePath = file.storage_path ?? (file.file_url.match(/\/song-pdfs\/(.+)$/)?.[1] ?? null)

      if (!storagePath) {
        console.error('Could not determine storage path for deletion:', file)
      } else {
        await supabase.storage.from('song-pdfs').remove([storagePath])
      }

      await supabase.from('song_files').delete().eq('id', fileId)
      setPdfFiles(prev => prev.filter(f => f.id !== fileId))
    } catch (err) {
      console.error('Error deleting PDF:', err)
    }
  }

  const handlePdfRowClick = (file: SongFile) => {
    if (pdfClickTimeouts.current[file.id]) {
      window.clearTimeout(pdfClickTimeouts.current[file.id])
    }
    pdfClickTimeouts.current[file.id] = window.setTimeout(() => {
      setPreviewPdfUrl(prev => (prev === file.file_url ? null : file.file_url))
      delete pdfClickTimeouts.current[file.id]
    }, 200)
  }

  const handlePdfRowDoubleClick = (file: SongFile) => {
    if (pdfClickTimeouts.current[file.id]) {
      window.clearTimeout(pdfClickTimeouts.current[file.id])
      delete pdfClickTimeouts.current[file.id]
    }
    window.open(file.file_url, '_blank', 'noopener,noreferrer')
  }

  const handleRenamePdf = async (file: SongFile) => {
    setEditingPdfId(file.id)
    setEditingPdfName(file.file_name)
  }

  const handleUpdatePdfName = async () => {
    if (!editingPdfId || !editingPdfName.trim() || !session?.user?.id) return
    setPdfError('')
    const trimmed = editingPdfName.trim()
    const { error } = await supabase
      .from('song_files')
      .update({ file_name: trimmed })
      .eq('id', editingPdfId)
      .eq('user_id', session.user.id)
    if (error) {
      console.error('Error renaming PDF:', error)
      setPdfError('Unable to update PDF name. Please try again.')
      return
    }
    setPdfFiles(prev => prev.map(f => (f.id === editingPdfId ? { ...f, file_name: trimmed } : f)))
    setEditingPdfId(null)
    setEditingPdfName('')
  }

  const handleCancelPdfEdit = () => {
    setEditingPdfId(null)
    setEditingPdfName('')
    setPdfError('')
    skipPdfRowClickRef.current = true
    window.setTimeout(() => {
      skipPdfRowClickRef.current = false
    }, 0)
  }

  const handleAddSongToSetlist = async (setlistId?: string) => {
    const targetId = setlistId ?? selectedSetlistId
    if (!song || !session?.user?.id || !targetId) return
    if (songSetlistIds.includes(targetId)) return
    const { data: lastItem } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', targetId)
      .eq('user_id', session.user.id)
      .order('position', { ascending: false })
      .limit(1)
    const nextPosition = (lastItem?.[0]?.position ?? -1) + 1
    const { error } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: targetId,
        song_id: song.id,
        user_id: session.user.id,
        position: nextPosition
      })
    if (error) {
      console.error('Error adding to setlist:', error)
      return
    }
    setSongSetlistIds(prev => [...prev, targetId])
  }

  const handleCreateSetlistAndAdd = async () => {
    if (!newSetlistName.trim() || !session?.user?.id) return
    setSetlistError('')
    const { data, error } = await supabase
      .from('setlists')
      .insert({ name: newSetlistName.trim(), user_id: session.user.id })
      .select()
      .single()
    if (error) {
      console.error('Error adding setlist:', error)
      setSetlistError('Could not add setlist. Try a different name.')
      return
    }
    if (data) {
      setSetlists(prev => [...prev, data as Setlist].sort((a, b) => a.name.localeCompare(b.name)))
      setNewSetlistName('')
      setSelectedSetlistId(data.id)
      await handleAddSongToSetlist(data.id)
    }
  }

  const handleDeleteSong = async () => {
    if (!song || !session?.user?.id) return
    const confirmDelete = window.confirm('Delete this song and all its files?')
    if (!confirmDelete) return

    const { data: files, error: filesError } = await supabase
      .from('song_files')
      .select('storage_path, file_url')
      .eq('song_id', song.id)
      .eq('user_id', session.user.id)

    if (filesError) console.error('Error fetching files for deletion:', filesError)

    if (files && files.length > 0) {
      const paths = files
        .map(file => file.storage_path ?? (file.file_url?.match(/\/song-pdfs\/(.+)$/)?.[1] ?? null))
        .filter((path): path is string => Boolean(path))
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('song-pdfs').remove(paths)
        if (storageError) console.error('Error deleting storage files:', storageError)
      }
    }

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', song.id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting song:', error)
      return
    }

    router.push('/songs')
  }

  const toggleGenre = (genreId: string) => {
    setSelectedGenreIds(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    )
  }

  const handleAddGenre = async () => {
    if (!newGenreName.trim() || !session?.user?.id) return
    setGenreError('')
    const { data, error } = await supabase
      .from('genres')
      .insert({ name: newGenreName.trim(), user_id: session.user.id })
      .select()
      .single()
    if (error) {
      console.error('Error adding genre:', error)
      setGenreError('Could not add genre. Try a different name.')
      return
    }
    if (data) {
      setAllGenres(prev => [...prev, data as Genre].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedGenreIds(prev => [...prev, (data as Genre).id])
      setNewGenreName('')
    }
  }


  const handleSaveSong = async () => {
    if (!song || !session?.user?.id) return
    setSavingSong(true)
    setSaveError('')

    const { error: updateError } = await supabase
      .from('songs')
      .update({
        title: editTitle.trim(),
        artist: editArtist.trim() || null,
        status: editStatus
      })
      .eq('id', song.id)
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Error updating song:', updateError)
      setSaveError('Could not save changes. Please try again.')
      setSavingSong(false)
      return
    }

    const { error: deleteError } = await supabase
      .from('song_genres')
      .delete()
      .eq('song_id', song.id)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('Error clearing song genres:', deleteError)
      setSaveError('Song saved, but genres failed to update.')
      setSavingSong(false)
      return
    }

    if (selectedGenreIds.length > 0) {
      const { error: insertError } = await supabase.from('song_genres').insert(
        selectedGenreIds.map(genreId => ({
          song_id: song.id,
          genre_id: genreId,
          user_id: session.user.id
        }))
      )
      if (insertError) {
        console.error('Error saving song genres:', insertError)
        setSaveError('Song saved, but genres failed to update.')
        setSavingSong(false)
        return
      }
    }

    setSong(prev => (prev ? { ...prev, title: editTitle, artist: editArtist, status: editStatus } : prev))
    const updatedGenres = selectedGenreIds.map(genreId => ({
      genre_id: genreId,
      genres: { name: allGenres.find(g => g.id === genreId)?.name ?? 'Unknown' }
    }))
    setSongGenres(updatedGenres)
    setIsEditing(false)
    setSavingSong(false)
  }

  if (loadError) return <p className="p-6 text-red-600">{loadError}</p>
  if (!song) return <p className="p-6">Loading...</p>

  return (
    <div className="page">
      <div className="mb-4 flex gap-4">
        <button onClick={() => router.push('/songs')} className="button-link button-link-large">
          ← Back to Songs
        </button>
        {fromSetlistId && (
          <button
            onClick={() => router.push(`/setlists/${fromSetlistId}`)}
            className="button-link button-link-large"
          >
            ← Back to Setlist
          </button>
        )}
      </div>

      {/* Song Header */}
      <div className="card p-6 mb-6">
        {!isEditing ? (
          <>
            <p className="label mb-2">Song</p>
            <h1 className="text-3xl font-semibold tracking-tight">{song.title}</h1>
            <p className="muted">{song.artist || 'Unknown Artist'}</p>
            <span className="badge mt-2">{song.status}</span>
            {songGenres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {songGenres.map(g => (
                  <span
                    key={g.genre_id}
                    className="badge"
                  >
                    {g.genres?.name ?? 'Unknown'}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 action-group">
              <button
                onClick={() => setIsEditing(true)}
                className="button-ghost action-button action-button-compact"
              >
                <span className="inline-flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path
                      d="M4 20h4l10-10-4-4L4 16v4z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Edit
                </span>
              </button>
              <button
                onClick={handleDeleteSong}
                className="button-ghost button-danger action-button action-button-compact"
              >
                <span className="inline-flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path
                      d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  Delete
                </span>
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="input w-full"
              placeholder="Song title"
            />
            <input
              type="text"
              value={editArtist}
              onChange={e => setEditArtist(e.target.value)}
              className="input w-full"
              placeholder="Artist (optional)"
            />
            <select
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              className="input w-full"
            >
              <option value="known">Known</option>
              <option value="learning">Learning</option>
              <option value="wishlist">Wishlist</option>
            </select>
            <div className="border border-[var(--border)] rounded px-3 py-2">
              <p className="label mb-2">Genres (multi-select)</p>
              {allGenres.length === 0 ? (
                <p className="text-sm muted">No genres yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allGenres.map(genre => (
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
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Add a genre (e.g. Jazz)"
                  value={newGenreName}
                  onChange={e => setNewGenreName(e.target.value)}
                  className="input w-full"
                />
                {genreError && <p className="text-xs text-red-600 mt-2">{genreError}</p>}
              </div>
              <button
                type="button"
                onClick={handleAddGenre}
                className="button-ghost"
              >
                Add Genre
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveSong}
                disabled={savingSong || !editTitle.trim()}
                className={`button-primary ${savingSong ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {savingSong ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditTitle(song.title || '')
                  setEditArtist(song.artist || '')
                  setEditStatus(song.status || 'learning')
                  setSelectedGenreIds(songGenres.map(g => g.genre_id))
                  setSaveError('')
                }}
                className="button-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="card p-6 mb-6">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path
              d="M10 13a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1 1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M14 11a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Links</h2>
        </div>
        <div className="section-divider" />
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Title (optional)"
            value={linkTitle}
            onChange={e => {
              setLinkTitle(e.target.value)
              if (linkError) setLinkError('')
            }}
            className="input flex-1"
          />
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={e => {
              setLinkUrl(e.target.value)
              if (linkError) setLinkError('')
            }}
            className="input flex-1"
          />
          <button onClick={handleAddLink} className="button-primary">Add</button>
        </div>
        {linkError && <p className="text-sm text-red-600 mb-3">{linkError}</p>}
        {links.length === 0 ? <p className="muted">No links yet.</p> : (
          <ul className="space-y-2">
            {links.map(link => (
              <li
                key={link.id}
                className="row row-clickable flex justify-between items-center"
                onClick={() => {
                  if (skipLinkRowClickRef.current) return
                  if (!editingLinkId) handleLinkRowClick(link)
                }}
                onDoubleClick={() => {
                  if (skipLinkRowClickRef.current) return
                  if (!editingLinkId) handleLinkRowDoubleClick(link)
                }}
              >
                {editingLinkId === link.id ? (
                  <div
                    className="w-full"
                    onBlur={event => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        handleCancelLinkEdit()
                      }
                    }}
                  >
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Title (optional)"
                        value={editingLinkTitle}
                        onChange={e => {
                          setEditingLinkTitle(e.target.value)
                          if (linkError) setLinkError('')
                        }}
                        onKeyDown={event => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            handleUpdateLink()
                          }
                        }}
                        className="input flex-1"
                        autoFocus
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={editingLinkUrl}
                        onChange={e => {
                          setEditingLinkUrl(e.target.value)
                          if (linkError) setLinkError('')
                        }}
                        onKeyDown={event => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            handleUpdateLink()
                          }
                        }}
                        className="input flex-1"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateLink}
                        className="button-primary"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="button-link text-left">{link.title || link.url}</span>
                    <div className="menu-container" onClick={event => event.stopPropagation()}>
                      <button
                        type="button"
                        className="button-ghost menu-trigger"
                        onClick={event => {
                          event.stopPropagation()
                          setOpenLinkMenuId(prev => (prev === link.id ? null : link.id))
                        }}
                      >
                        <span className="menu-dots" aria-hidden="true">⋯</span>
                        <span className="sr-only">Link actions</span>
                      </button>
                      {openLinkMenuId === link.id && (
                        <div
                          className="menu"
                          onClick={event => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="menu-item"
                            onClick={() => {
                              handleEditLink(link)
                              setOpenLinkMenuId(null)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="menu-item"
                            onClick={() => {
                              window.open(link.url, '_blank', 'noopener,noreferrer')
                              setOpenLinkMenuId(null)
                            }}
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            className="menu-item menu-danger"
                            onClick={() => {
                              handleDeleteLink(link.id)
                              setOpenLinkMenuId(null)
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
            {previewYoutubeUrl && (
          <div className="mt-4" ref={youtubePreviewRef}>
            <p className="label mb-2">Video preview</p>
            <div className="card-strong p-2">
              <p className="text-sm font-medium mb-2 mono">{previewYoutubeTitle || 'YouTube'}</p>
              <div className="aspect-video">
                <iframe
                  src={previewYoutubeUrl}
                  title={previewYoutubeTitle || 'YouTube player'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PDFs */}
      <div className="card p-6 mb-6">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path
              d="M7 4h7l4 4v12H7z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M14 4v4h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">PDFs</h2>
        </div>
        <div className="section-divider" />
        <div className="flex gap-2 items-center mb-2">
          <input
            type="file"
            accept=".pdf"
            onChange={e => {
              const file = e.target.files?.[0] || null
              if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
                setPdfFile(file)
              } else if (file) {
                console.error('Only PDF files are supported.')
              } else {
                setPdfFile(null)
              }
            }}
            className="input flex-1"
          />
          <button
            onClick={handleUploadPdf}
            disabled={!pdfFile || !session?.user?.id || uploading}
            className={`button-primary ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {uploading && (
          <div className="mt-2">
            <div className="h-2 bg-[var(--surface-strong)] rounded">
              <div
                className="h-2 bg-[var(--accent)] rounded"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs muted mt-1">{uploadProgress}%</p>
          </div>
        )}
        {pdfError && <p className="text-sm text-red-600 mb-3">{pdfError}</p>}
        {pdfFiles.length === 0 ? <p className="muted">No PDFs uploaded yet.</p> : (
          <>
            <ul className="space-y-2">
            {pdfFiles.map(file => (
              <li
                key={file.id}
                className="row row-clickable flex justify-between items-center"
                onClick={() => {
                  if (skipPdfRowClickRef.current) return
                  if (!editingPdfId) handlePdfRowClick(file)
                }}
                onDoubleClick={() => {
                  if (skipPdfRowClickRef.current) return
                  if (!editingPdfId) handlePdfRowDoubleClick(file)
                }}
              >
                {editingPdfId === file.id ? (
                  <div
                    className="w-full flex items-center gap-2"
                    onBlur={event => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        handleCancelPdfEdit()
                      }
                    }}
                  >
                    <input
                      type="text"
                      value={editingPdfName}
                      onChange={event => {
                        setEditingPdfName(event.target.value)
                        if (pdfError) setPdfError('')
                      }}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleUpdatePdfName()
                        }
                      }}
                      className="input flex-1"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="button-primary"
                      onClick={handleUpdatePdfName}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <span className="button-link text-left">{file.file_name}</span>
                )}
                {!editingPdfId && (
                  <div className="menu-container" onClick={event => event.stopPropagation()}>
                    <button
                      type="button"
                      className="button-ghost menu-trigger"
                      onClick={event => {
                        event.stopPropagation()
                        setOpenPdfMenuId(prev => (prev === file.id ? null : file.id))
                      }}
                    >
                      <span className="menu-dots" aria-hidden="true">⋯</span>
                      <span className="sr-only">PDF actions</span>
                    </button>
                    {openPdfMenuId === file.id && (
                      <div
                        className="menu"
                        onClick={event => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="menu-item"
                          onClick={() => {
                            handleRenamePdf(file)
                            setOpenPdfMenuId(null)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="menu-item"
                          onClick={() => {
                            window.open(file.file_url, '_blank', 'noopener,noreferrer')
                            setOpenPdfMenuId(null)
                          }}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          className="menu-item menu-danger"
                          onClick={() => {
                            handleDeletePdf(file.id)
                            setOpenPdfMenuId(null)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
            </ul>
            {previewPdfUrl && (
              <div className="mt-4" ref={pdfPreviewRef}>
                <p className="label mb-2">PDF preview</p>
                <div className="card-strong overflow-hidden">
                  <iframe
                    src={previewPdfUrl}
                    title="PDF preview"
                    className="w-full h-[32rem]"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notes */}
      <div className="card p-6">
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
          <h2 className="text-xl font-semibold">Notes</h2>
        </div>
        <div className="section-divider" />
        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." className="input w-full mb-2 min-h-[80px]" />
        <button onClick={handleAddNote} className="button-primary mb-6">Save Note</button>
        {notes.length === 0 ? <p className="muted">No notes yet.</p> : (
          <ul className="space-y-3">
            {notes.map(note => (
              <li key={note.id} className="row flex justify-between items-start">
                {editingNoteId === note.id ? (
                  <div className="w-full">
                    <textarea
                      value={editingNoteContent}
                      onChange={e => setEditingNoteContent(e.target.value)}
                      className="input w-full mb-2 min-h-[80px]"
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
                    <p className="whitespace-pre-wrap flex-1">{note.content}</p>
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

      {/* Setlists */}
      <div className="card p-6 mt-6">
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
          <h2 className="text-xl font-semibold">Setlists</h2>
        </div>
        <div className="section-divider" />

        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <span className="label w-32 text-base">Add to:</span>
            <select
              value={selectedSetlistId}
              onChange={e => setSelectedSetlistId(e.target.value)}
              className="input flex-1"
            >
              <option value="">Choose setlist…</option>
              {setlists.map(setlist => (
                <option key={setlist.id} value={setlist.id}>
                  {setlist.name}
                </option>
              ))}
            </select>
            <button onClick={handleAddSongToSetlist} className="button-primary">
              Add
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="label w-32 text-base">Create new setlist:</span>
            <input
              type="text"
              placeholder="New setlist name"
              value={newSetlistName}
              onChange={e => setNewSetlistName(e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={handleCreateSetlistAndAdd}
              className="button-ghost"
            >
              Create
            </button>
          </div>
        </div>

        {setlistError && <p className="text-sm text-red-600 mt-2">{setlistError}</p>}
        <div className="mt-4">
          {setlists.length === 0 ? (
            <p className="text-sm muted">No setlists yet.</p>
          ) : songSetlistIds.length === 0 ? (
            <p className="text-sm muted">Not in any setlists yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {songSetlistIds.map(idValue => (
                <span key={idValue} className="badge">
                  {setlists.find(s => s.id === idValue)?.name ?? 'Setlist'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
