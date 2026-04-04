'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import type { PracticeLoop } from '../../components/YouTubePracticePlayer'
import ListenSection from '../../components/song-detail/ListenSection'
import ReadSection from '../../components/song-detail/ReadSection'
import RecordSection from '../../components/song-detail/RecordSection'
import SetlistsSection from '../../components/song-detail/SetlistsSection'
import ThinkSection from '../../components/song-detail/ThinkSection'
import { useSupabaseSession } from '../../components/SessionProvider'
import { useToast } from '../../components/ToastProvider'
import { getYouTubeEmbedUrl } from '@/utils/youtubeHelpers'

interface Song {
  id: string
  title: string
  artist: string
  status: string
  is_demo?: boolean
}

interface Note {
  id: string
  content: string
  created_at: string
  link_id?: string | null
  file_id?: string | null
  recording_id?: string | null
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

interface SongRecording {
  id: string
  file_name: string
  file_url: string
  storage_path?: string
}

interface SongLoopRecord {
  id: string
  song_id: string
  link_id: string
  user_id: string
  name: string
  loop_start: number
  loop_end: number
  created_at: string
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

type ViewMode = 'table' | 'grid' | 'tabs'
type SectionNavId = 'listen' | 'read' | 'record' | 'think' | 'setlists'
const SECTION_SCROLL_PADDING = 16

const getLinkSource = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return 'Unknown source'
  }
}

const getLinkDisplayTitle = (link: SongLink) => {
  const title = link.title?.trim()
  if (title) return title
  return getLinkSource(link.url)
}

const MAX_PDF_SIZE_BYTES = 12 * 1024 * 1024
const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024

export default function SongDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSetlistId = searchParams.get('fromSetlist')
  const { addToast } = useToast()

  const [song, setSong] = useState<Song | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [links, setLinks] = useState<SongLink[]>([])
  const [pdfFiles, setPdfFiles] = useState<SongFile[]>([])
  const [recordings, setRecordings] = useState<SongRecording[]>([])
  const [savedLoops, setSavedLoops] = useState<SongLoopRecord[]>([])
  const [songGenres, setSongGenres] = useState<SongGenre[]>([])
  const [allGenres, setAllGenres] = useState<Genre[]>([])
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [songSetlistIds, setSongSetlistIds] = useState<string[]>([])

  const [globalViewMode] = useState<ViewMode>('table')

  const [newNote, setNewNote] = useState('')
  const [newNoteLinkId, setNewNoteLinkId] = useState<string>('')
  const [newNotePdfId, setNewNotePdfId] = useState<string>('')
  const [newNoteRecordingId, setNewNoteRecordingId] = useState<string>('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [recordingName, setRecordingName] = useState('')
  const [recordingAudioBlob, setRecordingAudioBlob] = useState<Blob | null>(null)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaChunksRef = useRef<Blob[]>([])
  const [audioUploading, setAudioUploading] = useState(false)
  const [audioError, setAudioError] = useState('')
  const [openRecordingMenuId, setOpenRecordingMenuId] = useState<string | null>(null)
  const [editingRecordingId, setEditingRecordingId] = useState<string | null>(null)
  const [editingRecordingName, setEditingRecordingName] = useState('')
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
  const [editingNoteLinkId, setEditingNoteLinkId] = useState<string>('')
  const [editingNotePdfId, setEditingNotePdfId] = useState<string>('')
  const [editingNoteRecordingId, setEditingNoteRecordingId] = useState<string>('')
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editingLinkTitle, setEditingLinkTitle] = useState('')
  const [editingLinkUrl, setEditingLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const [newSetlistName, setNewSetlistName] = useState('')
  const [setlistError, setSetlistError] = useState('')
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [previewPdfId, setPreviewPdfId] = useState<string | null>(null)
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null)
  const [previewAudioId, setPreviewAudioId] = useState<string | null>(null)
  const [previewYoutubeUrl, setPreviewYoutubeUrl] = useState<string | null>(null)
  const [previewYoutubeTitle, setPreviewYoutubeTitle] = useState('')
  const [previewLinkId, setPreviewLinkId] = useState<string | null>(null)
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null)
  const [editingPdfName, setEditingPdfName] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [newGenreName, setNewGenreName] = useState('')
  const [genreError, setGenreError] = useState('')
  const [openLinkMenuId, setOpenLinkMenuId] = useState<string | null>(null)
  const [openPdfMenuId, setOpenPdfMenuId] = useState<string | null>(null)
  const [openNoteMenuId, setOpenNoteMenuId] = useState<string | null>(null)
  const [isSongHeaderMenuOpen, setIsSongHeaderMenuOpen] = useState(false)

  const [activeLinkTabId, setActiveLinkTabId] = useState<string | null>(null)
  const [activePdfTabId, setActivePdfTabId] = useState<string | null>(null)
  const [activeNoteTabId, setActiveNoteTabId] = useState<string | null>(null)
  const [activeSetlistTabId, setActiveSetlistTabId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionNavId>('listen')
  const [headerHeight, setHeaderHeight] = useState(68)
  const [sectionScrollOffset, setSectionScrollOffset] = useState(132)

  const { session } = useSupabaseSession()
  const linkClickTimeouts = useRef<Record<string, number>>({})
  const pdfClickTimeouts = useRef<Record<string, number>>({})
  const skipLinkRowClickRef = useRef(false)
  const skipPdfRowClickRef = useRef(false)
  const pdfPreviewRef = useRef<HTMLDivElement | null>(null)
  const youtubePreviewRef = useRef<HTMLDivElement | null>(null)
  const songHeaderCardRef = useRef<HTMLDivElement | null>(null)
  const songHeaderMenuRef = useRef<HTMLDivElement | null>(null)
  const sectionNavRef = useRef<HTMLDivElement | null>(null)
  const listenSectionRef = useRef<HTMLDivElement | null>(null)
  const readSectionRef = useRef<HTMLDivElement | null>(null)
  const recordSectionRef = useRef<HTMLDivElement | null>(null)
  const thinkSectionRef = useRef<HTMLDivElement | null>(null)
  const setlistsSectionRef = useRef<HTMLDivElement | null>(null)
  const visibleSectionRatiosRef = useRef<Partial<Record<SectionNavId, number>>>({})
  const [selectedSetlistId, setSelectedSetlistId] = useState<string>('')

  const effectiveActiveLinkTabId = useMemo(() => {
    if (globalViewMode !== 'tabs') return null
    if (activeLinkTabId && links.some(link => link.id === activeLinkTabId)) return activeLinkTabId
    return links[0]?.id ?? null
  }, [globalViewMode, activeLinkTabId, links])

  const effectiveActivePdfTabId = useMemo(() => {
    if (globalViewMode !== 'tabs') return null
    if (activePdfTabId && pdfFiles.some(file => file.id === activePdfTabId)) return activePdfTabId
    return pdfFiles[0]?.id ?? null
  }, [globalViewMode, activePdfTabId, pdfFiles])

  const effectiveActiveNoteTabId = useMemo(() => {
    if (globalViewMode !== 'tabs') return null
    if (activeNoteTabId && notes.some(note => note.id === activeNoteTabId)) return activeNoteTabId
    return notes[0]?.id ?? null
  }, [globalViewMode, activeNoteTabId, notes])

  const effectiveActiveSetlistTabId = useMemo(() => {
    if (globalViewMode !== 'tabs') return null
    if (activeSetlistTabId && setlists.some(setlist => setlist.id === activeSetlistTabId)) {
      return activeSetlistTabId
    }
    return setlists[0]?.id ?? null
  }, [globalViewMode, activeSetlistTabId, setlists])

  useEffect(() => {
    const updateStickyOffsets = () => {
      const appHeader = document.querySelector('.app-header')
      const nextHeaderHeight = appHeader instanceof HTMLElement
        ? Math.round(appHeader.getBoundingClientRect().height)
        : 68
      const nextNavHeight = sectionNavRef.current
        ? Math.round(sectionNavRef.current.getBoundingClientRect().height)
        : 48

      setHeaderHeight(nextHeaderHeight)
      setSectionScrollOffset(nextHeaderHeight + nextNavHeight + SECTION_SCROLL_PADDING)
    }

    updateStickyOffsets()
    window.addEventListener('resize', updateStickyOffsets)

    return () => window.removeEventListener('resize', updateStickyOffsets)
  }, [song?.id, links.length, pdfFiles.length, recordings.length, notes.length, setlists.length])

  useEffect(() => {
    if (!isSongHeaderMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!songHeaderMenuRef.current?.contains(event.target as Node)) {
        setIsSongHeaderMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isSongHeaderMenuOpen])

  useEffect(() => {
    const sections = [
      { id: 'listen' as const, ref: listenSectionRef },
      { id: 'read' as const, ref: readSectionRef },
      { id: 'record' as const, ref: recordSectionRef },
      { id: 'think' as const, ref: thinkSectionRef },
      { id: 'setlists' as const, ref: setlistsSectionRef }
    ].filter(section => section.ref.current)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const sectionId = entry.target.getAttribute('data-section-nav-id') as SectionNavId | null
          if (!sectionId) return

          if (entry.isIntersecting) {
            visibleSectionRatiosRef.current[sectionId] = entry.intersectionRatio
            return
          }

          delete visibleSectionRatiosRef.current[sectionId]
        })

        const nextActiveSection = sections
          .map(section => ({
            id: section.id,
            ratio: visibleSectionRatiosRef.current[section.id] ?? 0,
            top: section.ref.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
          }))
          .filter(section => section.ratio > 0)
          .sort((a, b) => {
            if (b.ratio !== a.ratio) return b.ratio - a.ratio
            return Math.abs(a.top - sectionScrollOffset) - Math.abs(b.top - sectionScrollOffset)
          })[0]?.id

        if (nextActiveSection) {
          setActiveSection(current => (current === nextActiveSection ? current : nextActiveSection))
        }
      },
      {
        rootMargin: `-${sectionScrollOffset}px 0px -55% 0px`,
        threshold: [0.1, 0.2, 0.35, 0.5, 0.7]
      }
    )

    sections.forEach(section => {
      if (section.ref.current) observer.observe(section.ref.current)
    })

    return () => observer.disconnect()
  }, [sectionScrollOffset, song?.id])

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

      // Recordings
      const { data: recordingsData } = await supabase
        .from('song_recordings')
        .select('*')
        .eq('song_id', id)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      const { data: loopData } = await supabase
        .from('song_loops')
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
      setRecordings(recordingsData || [])
      setSavedLoops((loopData as SongLoopRecord[]) || [])
      setSongGenres((genreData as unknown as SongGenre[]) || [])
      setAllGenres((allGenresData as Genre[]) || [])
      setSetlists((setlistsData as Setlist[]) || [])
      setSongSetlistIds(((songSetlistsData as { setlist_id: string }[]) || []).map(s => s.setlist_id))
      setEditTitle(songData.title || '')
      setEditArtist(songData.artist || '')
      setEditStatus(songData.status || 'learning')
      setSelectedGenreIds(((genreData as unknown as SongGenre[]) || []).map(g => g.genre_id))
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
      setOpenRecordingMenuId(null)
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

  const getNoteLabel = (note: Note, index: number) => {
    const text = note.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    if (!text) return `Note ${index + 1}`
    return text.length > 28 ? `${text.slice(0, 28)}…` : text
  }

  // ---------- Notes ----------
  const handleAddNote = async () => {
    if (!newNote.replace(/<[^>]*>/g, '').trim() || !session?.user?.id) {
      addToast({ title: 'Note is empty', description: 'Add some text before saving.', variant: 'error' })
      return
    }

    const { data, error } = await supabase
      .from('song_notes')
      .insert({
        song_id: id,
        user_id: session.user.id,
        content: newNote,
        link_id: newNoteLinkId || null,
        file_id: newNotePdfId || null,
        recording_id: newNoteRecordingId || null
      })
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error adding note:', error)
      addToast({ title: 'Could not save note', description: 'Please try again.', variant: 'error' })
      return
    }
    if (data) {
      setNotes(prev => [data, ...prev])
      setNewNote('')
      setNewNoteLinkId('')
      setNewNotePdfId('')
      setNewNoteRecordingId('')
      addToast({ title: 'Note saved', variant: 'success' })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from('song_notes').delete().eq('id', noteId)
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting note:', error)
      addToast({ title: 'Could not delete note', description: 'Please try again.', variant: 'error' })
      return
    }
    setNotes(prev => prev.filter(n => n.id !== noteId))
    addToast({ title: 'Note deleted', variant: 'success' })
  }

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id)
    setEditingNoteContent(note.content)
    setEditingNoteLinkId(note.link_id ?? '')
    setEditingNotePdfId(note.file_id ?? '')
    setEditingNoteRecordingId(note.recording_id ?? '')
  }

  const handleUpdateNote = async () => {
    if (!editingNoteId || !editingNoteContent.replace(/<[^>]*>/g, '').trim() || !session?.user?.id) {
      addToast({ title: 'Note is empty', description: 'Add some text before saving.', variant: 'error' })
      return
    }
    const { data, error } = await supabase
      .from('song_notes')
      .update({
        content: editingNoteContent.trim(),
        link_id: editingNoteLinkId || null,
        file_id: editingNotePdfId || null,
        recording_id: editingNoteRecordingId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingNoteId)
      .eq('user_id', session.user.id)
      .select()
      .single()
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating note:', error)
      addToast({ title: 'Could not update note', description: 'Please try again.', variant: 'error' })
      return
    }
    if (data) {
      setNotes(prev => prev.map(n => (n.id === data.id ? (data as Note) : n)))
      setEditingNoteId(null)
      setEditingNoteContent('')
      setEditingNoteLinkId('')
      setEditingNotePdfId('')
      setEditingNoteRecordingId('')
      addToast({ title: 'Note updated', variant: 'success' })
    }
  }

  // ---------- Links ----------
  const handleAddLink = async () => {
    if (!linkUrl.trim() || !session?.user?.id) {
      addToast({ title: 'Link is required', description: 'Paste a valid URL.', variant: 'error' })
      return
    }
    setLinkError('')
    let parsed: URL | null = null
    try {
      parsed = new URL(linkUrl.trim())
    } catch {
      parsed = null
    }
    if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
      setLinkError('Please enter a valid http(s) link.')
      addToast({ title: 'Invalid link', description: 'Use http:// or https://', variant: 'error' })
      return
    }

    const { data, error } = await supabase
      .from('song_links')
      .insert({ song_id: id, user_id: session.user.id, title: linkTitle || null, url: linkUrl })
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error adding link:', error)
      addToast({ title: 'Could not add link', description: 'Please try again.', variant: 'error' })
      return
    }
    if (data) {
      setLinks(prev => [data, ...prev])
      setLinkTitle('')
      setLinkUrl('')
      addToast({ title: 'Link added', variant: 'success' })
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    const { error } = await supabase.from('song_links').delete().eq('id', linkId)
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting link:', error)
      addToast({ title: 'Could not delete link', description: 'Please try again.', variant: 'error' })
      return
    }
    setLinks(prev => prev.filter(l => l.id !== linkId))
    setSavedLoops(prev => prev.filter(loop => loop.link_id !== linkId))
    if (previewLinkId === linkId) {
      setPreviewYoutubeUrl(null)
      setPreviewYoutubeTitle('')
      setPreviewLinkId(null)
    }
    addToast({ title: 'Link deleted', variant: 'success' })
  }

  const handleEditLink = (link: SongLink) => {
    setEditingLinkId(link.id)
    setEditingLinkTitle(link.title || '')
    setEditingLinkUrl(link.url)
  }

  const handleUpdateLink = async () => {
    if (!editingLinkId || !editingLinkUrl.trim() || !session?.user?.id) {
      addToast({ title: 'Link is required', description: 'Paste a valid URL.', variant: 'error' })
      return
    }
    setLinkError('')
    let parsed: URL | null = null
    try {
      parsed = new URL(editingLinkUrl.trim())
    } catch {
      parsed = null
    }
    if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
      setLinkError('Please enter a valid http(s) link.')
      addToast({ title: 'Invalid link', description: 'Use http:// or https://', variant: 'error' })
      return
    }
    const { error } = await supabase
      .from('song_links')
      .update({ title: editingLinkTitle.trim() || null, url: editingLinkUrl.trim() })
      .eq('id', editingLinkId)
      .eq('user_id', session.user.id)
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating link:', error)
      setLinkError('Unable to update link. Please try again.')
      addToast({ title: 'Could not update link', description: 'Please try again.', variant: 'error' })
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
    addToast({ title: 'Link updated', variant: 'success' })
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
        setPreviewYoutubeTitle(next ? getLinkDisplayTitle(link) : '')
        setPreviewLinkId(next ? link.id : null)
        return next
      })
      return
    }
    setPreviewYoutubeUrl(null)
    setPreviewYoutubeTitle('')
    setPreviewLinkId(null)
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

  const handleSavePracticeLoop = async ({
    name,
    loopStart,
    loopEnd,
  }: {
    name: string
    loopStart: number
    loopEnd: number
  }) => {
    if (!id || !session?.user?.id || !previewLinkId) {
      throw new Error('Open a YouTube link before saving a loop.')
    }

    const { data, error } = await supabase
      .from('song_loops')
      .insert({
        song_id: id,
        link_id: previewLinkId,
        user_id: session.user.id,
        name: name.trim(),
        loop_start: loopStart,
        loop_end: loopEnd,
      })
      .select()
      .single()

    if (error || !data) {
      if (process.env.NODE_ENV === 'development') console.error('Error saving practice loop:', error)
      throw new Error(error?.message || 'Could not save this loop.')
    }

    setSavedLoops(prev => [data as SongLoopRecord, ...prev])
    addToast({ title: 'Loop saved', variant: 'success' })
  }

  const handleDeletePracticeLoop = async (loopId: string) => {
    if (!session?.user?.id) {
      throw new Error('You must be signed in to delete a loop.')
    }

    const { error } = await supabase
      .from('song_loops')
      .delete()
      .eq('id', loopId)
      .eq('user_id', session.user.id)

    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting practice loop:', error)
      throw new Error(error.message || 'Could not delete this loop.')
    }

    setSavedLoops(prev => prev.filter(loop => loop.id !== loopId))
    addToast({ title: 'Loop deleted', variant: 'success' })
  }

  // ---------- PDFs ----------
  const getStoragePathFromFile = (file: SongFile) =>
    file.storage_path ?? (file.file_url?.match(/\/song-pdfs\/(.+)$/)?.[1] ?? null)

  const getSignedPdfUrl = async (file: SongFile) => {
    const storagePath = getStoragePathFromFile(file)
    if (!storagePath) return null
    const { data, error } = await supabase.storage.from('song-pdfs').createSignedUrl(storagePath, 60 * 60)
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error creating signed URL:', error)
      return null
    }
    return data?.signedUrl ?? null
  }

  const openPdfInNewTab = async (file: SongFile) => {
    const signedUrl = await getSignedPdfUrl(file)
    if (!signedUrl) return
    window.open(signedUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePreviewPdf = async (file: SongFile) => {
    if (previewPdfId === file.id) {
      setPreviewPdfId(null)
      setPreviewPdfUrl(null)
      return
    }
    const signedUrl = await getSignedPdfUrl(file)
    if (!signedUrl) return
    setPreviewPdfId(file.id)
    setPreviewPdfUrl(signedUrl)
  }

  const handleUploadPdf = async () => {
    if (!pdfFile) {
      addToast({ title: 'No file selected', description: 'Choose a PDF to upload.', variant: 'error' })
      return
    }
    if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
      setPdfError(`PDF is too large. Max size is ${Math.round(MAX_PDF_SIZE_BYTES / (1024 * 1024))}MB.`)
      addToast({ title: 'PDF too large', description: 'Choose a smaller file.', variant: 'error' })
      return
    }
    if (!session?.user?.id) {
      if (process.env.NODE_ENV === 'development') console.error('Session not loaded or user ID missing')
      addToast({ title: 'Not signed in', description: 'Please sign in again.', variant: 'error' })
      return
    }

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
      if (process.env.NODE_ENV === 'development') console.error('Storage upload error:', err)
      setUploading(false)
      setUploadProgress(0)
      addToast({ title: 'Upload failed', description: 'Please try again.', variant: 'error' })
      return
    }

    // Insert into DB (RLS-safe)
    const { data: dbData, error: dbError } = await supabase
      .from('song_files')
      .insert({
        song_id: id,
        user_id: userId,
        file_name: pdfFile.name,
        file_url: filePath,
        storage_path: filePath
      })
      .select()
      .single()

    if (dbError) {
      if (process.env.NODE_ENV === 'development') console.error('DB insert error (RLS):', dbError)
      setUploading(false)
      setUploadProgress(0)
      addToast({ title: 'Upload saved, but DB failed', description: 'Please retry.', variant: 'error' })
      return
    }

    setPdfFiles(prev => [dbData, ...prev])
    setPdfFile(null)
    setUploading(false)
    setUploadProgress(0)
    setPdfError('')
    addToast({ title: 'PDF uploaded', variant: 'success' })
  }

  const handleDeletePdf = async (fileId: string) => {
    try {
      const file = pdfFiles.find(f => f.id === fileId)
      if (!file) {
        if (process.env.NODE_ENV === 'development') console.error('File not found for deletion:', fileId)
        addToast({ title: 'PDF not found', description: 'Please refresh and try again.', variant: 'error' })
        return
      }
      const confirmDelete = window.confirm(`Delete "${file.file_name}"?`)
      if (!confirmDelete) return

      // Prefer an explicit `storage_path` recorded in the DB. Fall back to
      // parsing the public URL if it isn't available.
      const storagePath = getStoragePathFromFile(file)

      if (!storagePath) {
        if (process.env.NODE_ENV === 'development') console.error('Could not determine storage path for deletion:', file)
        addToast({ title: 'Could not delete PDF', description: 'Missing storage path.', variant: 'error' })
      } else {
        const { error: storageError } = await supabase.storage.from('song-pdfs').remove([storagePath])
        if (storageError) {
          if (process.env.NODE_ENV === 'development') console.error('Error deleting storage file:', storageError)
          addToast({ title: 'Could not delete PDF', description: 'Storage delete failed.', variant: 'error' })
          return
        }
      }

      const { error: dbError } = await supabase.from('song_files').delete().eq('id', fileId)
      if (dbError) {
        if (process.env.NODE_ENV === 'development') console.error('Error deleting PDF record:', dbError)
        addToast({ title: 'Could not delete PDF', description: 'Database delete failed.', variant: 'error' })
        return
      }
      setPdfFiles(prev => prev.filter(f => f.id !== fileId))
      addToast({ title: 'PDF deleted', variant: 'success' })
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting PDF:', err)
      addToast({ title: 'Could not delete PDF', description: 'Please try again.', variant: 'error' })
    }
  }

  const handlePdfRowClick = (file: SongFile) => {
    if (pdfClickTimeouts.current[file.id]) {
      window.clearTimeout(pdfClickTimeouts.current[file.id])
    }
    pdfClickTimeouts.current[file.id] = window.setTimeout(() => {
      if (previewPdfId === file.id) {
        setPreviewPdfId(null)
        setPreviewPdfUrl(null)
        delete pdfClickTimeouts.current[file.id]
        return
      }
      getSignedPdfUrl(file).then(signedUrl => {
        if (!signedUrl) return
        setPreviewPdfId(file.id)
        setPreviewPdfUrl(signedUrl)
        delete pdfClickTimeouts.current[file.id]
      })
    }, 200)
  }

  const handlePdfRowDoubleClick = (file: SongFile) => {
    if (pdfClickTimeouts.current[file.id]) {
      window.clearTimeout(pdfClickTimeouts.current[file.id])
      delete pdfClickTimeouts.current[file.id]
    }
    openPdfInNewTab(file)
  }

  const handleRenamePdf = async (file: SongFile) => {
    setEditingPdfId(file.id)
    setEditingPdfName(file.file_name)
  }

  const handleUpdatePdfName = async () => {
    if (!editingPdfId || !editingPdfName.trim() || !session?.user?.id) {
      addToast({ title: 'Name is required', description: 'Enter a file name.', variant: 'error' })
      return
    }
    setPdfError('')
    const trimmed = editingPdfName.trim()
    const { error } = await supabase
      .from('song_files')
      .update({ file_name: trimmed })
      .eq('id', editingPdfId)
      .eq('user_id', session.user.id)
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error renaming PDF:', error)
      setPdfError('Unable to update PDF name. Please try again.')
      addToast({ title: 'Could not rename PDF', description: 'Please try again.', variant: 'error' })
      return
    }
    setPdfFiles(prev => prev.map(f => (f.id === editingPdfId ? { ...f, file_name: trimmed } : f)))
    setEditingPdfId(null)
    setEditingPdfName('')
    addToast({ title: 'PDF renamed', variant: 'success' })
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

  // ---------- Recordings ----------
  const getStoragePathFromRecording = (recordingItem: SongRecording) =>
    recordingItem.storage_path ?? (recordingItem.file_url?.match(/\/song-audio\/(.+)$/)?.[1] ?? null)

  const getSignedAudioUrl = async (recordingItem: SongRecording) => {
    const storagePath = getStoragePathFromRecording(recordingItem)
    if (!storagePath) return null
    const { data, error } = await supabase.storage.from('song-audio').createSignedUrl(storagePath, 60 * 60)
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error creating signed audio URL:', error)
      return null
    }
    return data?.signedUrl ?? null
  }

  const handlePreviewRecording = async (recordingItem: SongRecording) => {
    if (previewAudioId === recordingItem.id) {
      setPreviewAudioId(null)
      setPreviewAudioUrl(null)
      return
    }
    const signedUrl = await getSignedAudioUrl(recordingItem)
    if (!signedUrl) return
    setPreviewAudioId(recordingItem.id)
    setPreviewAudioUrl(signedUrl)
  }

  const handleStartRecording = async () => {
    if (recording) return
    setAudioError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaChunksRef.current = []
      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setRecordingAudioBlob(blob)
        setRecording(false)
        stream.getTracks().forEach(track => track.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
      setRecordingAudioBlob(null)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Recording failed to start:', error)
      setAudioError('Microphone access denied or unavailable.')
    }
  }

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  const handleUploadAudio = async (file: File) => {
    if (!session?.user?.id) {
      addToast({ title: 'Not signed in', description: 'Please sign in again.', variant: 'error' })
      return
    }
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      setAudioError(`Audio is too large. Max size is ${Math.round(MAX_AUDIO_SIZE_BYTES / (1024 * 1024))}MB.`)
      addToast({ title: 'Audio too large', description: 'Choose a smaller file.', variant: 'error' })
      return
    }

    setAudioUploading(true)
    setAudioError('')
    const userId = session.user.id
    const safeFileName = file.name.trim().replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${userId}/${Date.now()}_${safeFileName}`

    const { error: storageError } = await supabase.storage.from('song-audio').upload(filePath, file, {
      contentType: file.type || 'audio/mpeg',
      upsert: false
    })

    if (storageError) {
      if (process.env.NODE_ENV === 'development') console.error('Audio upload error:', storageError)
      setAudioUploading(false)
      addToast({ title: 'Upload failed', description: 'Please try again.', variant: 'error' })
      return
    }

    const { data: dbData, error: dbError } = await supabase
      .from('song_recordings')
      .insert({
        song_id: id,
        user_id: userId,
        file_name: file.name,
        file_url: filePath,
        storage_path: filePath
      })
      .select()
      .single()

    if (dbError) {
      if (process.env.NODE_ENV === 'development') console.error('Audio DB insert error:', dbError)
      setAudioUploading(false)
      addToast({ title: 'Upload saved, but DB failed', description: 'Please retry.', variant: 'error' })
      return
    }

    setRecordings(prev => [dbData, ...prev])
    setAudioUploading(false)
    setAudioFile(null)
    setRecordingName('')
    setRecordingAudioBlob(null)
    addToast({ title: 'Recording saved', variant: 'success' })
  }

  const handleSaveRecording = async () => {
    if (!recordingAudioBlob) {
      setAudioError('Record audio first or upload a file.')
      return
    }
    const baseName = recordingName.trim() || `Recording_${new Date().toISOString().slice(0, 19)}`
    const fileExtension = recordingAudioBlob.type.includes('ogg') ? 'ogg' : 'webm'
    const file = new File([recordingAudioBlob], `${baseName}.${fileExtension}`, {
      type: recordingAudioBlob.type || 'audio/webm'
    })
    await handleUploadAudio(file)
  }

  const handleDeleteRecording = async (recordingId: string) => {
    const recordingItem = recordings.find(item => item.id === recordingId)
    if (!recordingItem) return
    const confirmDelete = window.confirm(`Delete "${recordingItem.file_name}"?`)
    if (!confirmDelete) return

    const storagePath = getStoragePathFromRecording(recordingItem)
    if (storagePath) {
      const { error: storageError } = await supabase.storage.from('song-audio').remove([storagePath])
      if (storageError) {
        if (process.env.NODE_ENV === 'development') console.error('Error deleting audio file:', storageError)
        addToast({ title: 'Could not delete recording', description: 'Storage delete failed.', variant: 'error' })
        return
      }
    }

    const { error: dbError } = await supabase.from('song_recordings').delete().eq('id', recordingId)
    if (dbError) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting recording record:', dbError)
      addToast({ title: 'Could not delete recording', description: 'Database delete failed.', variant: 'error' })
      return
    }

    setRecordings(prev => prev.filter(item => item.id !== recordingId))
    if (previewAudioId === recordingId) {
      setPreviewAudioId(null)
      setPreviewAudioUrl(null)
    }
    addToast({ title: 'Recording deleted', variant: 'success' })
  }

  const handleRenameRecording = (recordingItem: SongRecording) => {
    setEditingRecordingId(recordingItem.id)
    setEditingRecordingName(recordingItem.file_name)
  }

  const handleUpdateRecordingName = async () => {
    if (!editingRecordingId || !editingRecordingName.trim() || !session?.user?.id) {
      addToast({ title: 'Name is required', description: 'Enter a recording name.', variant: 'error' })
      return
    }
    const trimmed = editingRecordingName.trim()
    const { error } = await supabase
      .from('song_recordings')
      .update({ file_name: trimmed })
      .eq('id', editingRecordingId)
      .eq('user_id', session.user.id)
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error renaming recording:', error)
      addToast({ title: 'Could not rename recording', description: 'Please try again.', variant: 'error' })
      return
    }
    setRecordings(prev => prev.map(item => (item.id === editingRecordingId ? { ...item, file_name: trimmed } : item)))
    setEditingRecordingId(null)
    setEditingRecordingName('')
    addToast({ title: 'Recording renamed', variant: 'success' })
  }

  const handleCancelRecordingEdit = () => {
    setEditingRecordingId(null)
    setEditingRecordingName('')
  }

  const handleAddSongToSetlist = async (setlistId?: string) => {
    const targetId = typeof setlistId === 'string' ? setlistId : selectedSetlistId
    if (!song || !session?.user?.id || !targetId) {
      addToast({ title: 'Select a setlist', description: 'Choose a setlist first.', variant: 'error' })
      return
    }
    if (songSetlistIds.includes(targetId)) {
      addToast({ title: 'Already added', description: 'Song is already in this setlist.', variant: 'info' })
      return
    }
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
      if (process.env.NODE_ENV === 'development') console.error('Error adding to setlist:', error)
      addToast({ title: 'Could not add to setlist', description: 'Please try again.', variant: 'error' })
      return
    }
    setSongSetlistIds(prev => [...prev, targetId])
    addToast({ title: 'Added to setlist', variant: 'success' })
  }

  const handleCreateSetlistAndAdd = async () => {
    if (!newSetlistName.trim() || !session?.user?.id) {
      addToast({ title: 'Setlist name required', description: 'Enter a name to create.', variant: 'error' })
      return
    }
    setSetlistError('')
    const { data, error } = await supabase
      .from('setlists')
      .insert({ name: newSetlistName.trim(), user_id: session.user.id })
      .select()
      .single()
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error adding setlist:', error)
      setSetlistError('Could not add setlist. Try a different name.')
      addToast({ title: 'Could not create setlist', description: 'Please try again.', variant: 'error' })
      return
    }
    if (data) {
      setSetlists(prev => [...prev, data as Setlist].sort((a, b) => a.name.localeCompare(b.name)))
      setNewSetlistName('')
      setSelectedSetlistId(data.id)
      await handleAddSongToSetlist(data.id)
      addToast({ title: 'Setlist created', variant: 'success' })
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

    if (filesError && process.env.NODE_ENV === 'development') console.error('Error fetching files for deletion:', filesError)

    if (files && files.length > 0) {
      const paths = files
        .map(file => file.storage_path ?? (file.file_url?.match(/\/song-pdfs\/(.+)$/)?.[1] ?? null))
        .filter((path): path is string => Boolean(path))
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('song-pdfs').remove(paths)
        if (storageError && process.env.NODE_ENV === 'development') console.error('Error deleting storage files:', storageError)
      }
    }

    const { data: audioFiles, error: audioFilesError } = await supabase
      .from('song_recordings')
      .select('storage_path, file_url')
      .eq('song_id', song.id)
      .eq('user_id', session.user.id)

    if (audioFilesError && process.env.NODE_ENV === 'development') console.error('Error fetching recordings for deletion:', audioFilesError)

    if (audioFiles && audioFiles.length > 0) {
      const paths = audioFiles
        .map(file => file.storage_path ?? (file.file_url?.match(/\/song-audio\/(.+)$/)?.[1] ?? null))
        .filter((path): path is string => Boolean(path))
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('song-audio').remove(paths)
        if (storageError && process.env.NODE_ENV === 'development') console.error('Error deleting recording files:', storageError)
      }
    }

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', song.id)
      .eq('user_id', session.user.id)

    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting song:', error)
      addToast({ title: 'Could not delete song', description: 'Please try again.', variant: 'error' })
      return
    }

    addToast({ title: 'Song deleted', variant: 'success' })
    router.push('/songs')
  }

  const toggleGenre = (genreId: string) => {
    setSelectedGenreIds(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    )
  }

  const handleAddGenre = async () => {
    if (!newGenreName.trim() || !session?.user?.id) {
      addToast({ title: 'Genre name required', description: 'Enter a genre name.', variant: 'error' })
      return
    }
    setGenreError('')
    const { data, error } = await supabase
      .from('genres')
      .insert({ name: newGenreName.trim(), user_id: session.user.id })
      .select()
      .single()
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error adding genre:', error)
      setGenreError('Could not add genre. Try a different name.')
      addToast({ title: 'Could not add genre', description: 'Please try again.', variant: 'error' })
      return
    }
    if (data) {
      setAllGenres(prev => [...prev, data as Genre].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedGenreIds(prev => [...prev, (data as Genre).id])
      setNewGenreName('')
      addToast({ title: 'Genre added', variant: 'success' })
    }
  }

  const cancelSongEdit = () => {
    if (!song) return
    setIsEditing(false)
    setEditTitle(song.title || '')
    setEditArtist(song.artist || '')
    setEditStatus(song.status || 'learning')
    setSelectedGenreIds(songGenres.map(g => g.genre_id))
    setSaveError('')
    setGenreError('')
    setNewGenreName('')
  }

  useEffect(() => {
    if (!isEditing) return

    const handleOutsideEditClick = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (songHeaderCardRef.current?.contains(target)) return
      cancelSongEdit()
    }

    document.addEventListener('mousedown', handleOutsideEditClick)
    return () => document.removeEventListener('mousedown', handleOutsideEditClick)
  }, [isEditing, song, songGenres])


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
      if (process.env.NODE_ENV === 'development') console.error('Error updating song:', updateError)
      setSaveError('Could not save changes. Please try again.')
      setSavingSong(false)
      addToast({ title: 'Could not save song', description: 'Please try again.', variant: 'error' })
      return
    }

    const { error: deleteError } = await supabase
      .from('song_genres')
      .delete()
      .eq('song_id', song.id)
      .eq('user_id', session.user.id)

    if (deleteError) {
      if (process.env.NODE_ENV === 'development') console.error('Error clearing song genres:', deleteError)
      setSaveError('Song saved, but genres failed to update.')
      setSavingSong(false)
      addToast({ title: 'Genres not updated', description: 'Please try again.', variant: 'error' })
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
        if (process.env.NODE_ENV === 'development') console.error('Error saving song genres:', insertError)
        setSaveError('Song saved, but genres failed to update.')
        setSavingSong(false)
        addToast({ title: 'Genres not updated', description: 'Please try again.', variant: 'error' })
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
    addToast({ title: 'Song saved', variant: 'success' })
  }

  const linkedNotesForLink = previewLinkId
    ? notes.filter(note => note.link_id === previewLinkId)
    : []
  const savedLoopsForPreviewLink: PracticeLoop[] = previewLinkId
    ? savedLoops
        .filter(loop => loop.link_id === previewLinkId)
        .map(loop => ({
          id: loop.id,
          name: loop.name,
          loopStart: loop.loop_start,
          loopEnd: loop.loop_end,
        }))
    : []
  const linkedNotesForPdf = previewPdfId
    ? notes.filter(note => note.file_id === previewPdfId)
    : []
  const linkedNotesForAudio = previewAudioId
    ? notes.filter(note => note.recording_id === previewAudioId)
    : []
  const sectionNavItems = [
    { id: 'listen' as const, label: 'Listen', count: links.length, ref: listenSectionRef },
    { id: 'read' as const, label: 'Read', count: pdfFiles.length, ref: readSectionRef },
    { id: 'record' as const, label: 'Record', count: recordings.length, ref: recordSectionRef },
    { id: 'think' as const, label: 'Think', count: notes.length, ref: thinkSectionRef },
    { id: 'setlists' as const, label: 'Setlists', count: setlists.length, ref: setlistsSectionRef }
  ]

  const scrollToSection = (ref: { current: HTMLDivElement | null }, sectionId: SectionNavId) => {
    const section = ref.current
    if (!section) return

    setActiveSection(sectionId)
    const top = window.scrollY + section.getBoundingClientRect().top - sectionScrollOffset
    window.scrollTo({ top, behavior: 'smooth' })
  }
  if (loadError) return <p className="p-6 text-red-600">{loadError}</p>
  if (!song) return <p className="p-6">Loading...</p>
  const songStatusLabel = song.status.charAt(0).toUpperCase() + song.status.slice(1)

  return (
    <div className="page">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4">
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
      </div>

      <div>
        {/* Song Header */}
        <div className={`card p-4 mb-6 song-header-card song-header-status-${song.status}`} ref={songHeaderCardRef}>
        {!isEditing ? (
          <>
            <div className="song-header-status-wrap">
              <span className={`song-header-status status-${song.status}`}>{songStatusLabel}</span>
            </div>
            <div className="song-header-main">
              <h1 className="text-4xl font-semibold tracking-tight heading-display song-header-title">{song.title}</h1>
              <p className="muted song-data">{song.artist || 'Unknown Artist'}</p>
              {songGenres.length > 0 && (
                <div className="song-header-genres">
                  {songGenres.map(g => (
                    <span
                      key={g.genre_id}
                      className="genre-pill"
                    >
                      {g.genres?.name ?? 'Unknown'}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="song-header-menu-row">
              <div
                ref={songHeaderMenuRef}
                className="menu-container"
                onClick={event => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="button-ghost menu-trigger song-header-menu-trigger"
                  onClick={event => {
                    event.stopPropagation()
                    setIsSongHeaderMenuOpen(prev => !prev)
                  }}
                >
                  <span className="menu-dots" aria-hidden="true">⋯</span>
                  <span className="sr-only">Song actions</span>
                </button>
                {isSongHeaderMenuOpen && (
                  <div className="song-header-menu-panel" onClick={event => event.stopPropagation()}>
                    <button
                      type="button"
                      className="menu-item"
                      onClick={() => {
                        setIsEditing(true)
                        setIsSongHeaderMenuOpen(false)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="menu-item menu-danger"
                      onClick={() => {
                        handleDeleteSong()
                        setIsSongHeaderMenuOpen(false)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="song-header-glow" aria-hidden="true" />
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
              <option value="confident">Confident</option>
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
                disabled={!newGenreName.trim() || !session?.user?.id}
                className={`button-ghost ${!newGenreName.trim() || !session?.user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                onClick={cancelSongEdit}
                className="button-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        </div>

        <div
          ref={sectionNavRef}
          className="card song-section-nav mb-6"
          style={{ top: `${headerHeight}px` }}
        >
          <div className="song-section-nav-inner">
            {sectionNavItems.map(item => (
              <button
                key={item.id}
                type="button"
                className={`tab-trigger song-section-nav-pill ${activeSection === item.id ? 'tab-active' : ''}`}
                aria-current={activeSection === item.id ? 'true' : undefined}
                onClick={() => scrollToSection(item.ref, item.id)}
              >
                <span>{item.label}</span>
                <span className="section-nav-count">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        <ListenSection
          editingLinkId={editingLinkId}
          editingLinkTitle={editingLinkTitle}
          editingLinkUrl={editingLinkUrl}
          effectiveActiveLinkTabId={effectiveActiveLinkTabId}
          getLinkDisplayTitle={getLinkDisplayTitle}
          getLinkSource={getLinkSource}
          globalViewMode={globalViewMode}
          handleAddLink={handleAddLink}
          handleCancelLinkEdit={handleCancelLinkEdit}
          handleDeleteLink={handleDeleteLink}
          handleDeletePracticeLoop={handleDeletePracticeLoop}
          handleEditLink={handleEditLink}
          handleLinkRowClick={handleLinkRowClick}
          handleLinkRowDoubleClick={handleLinkRowDoubleClick}
          handleOpenLink={handleOpenLink}
          handleSavePracticeLoop={handleSavePracticeLoop}
          handleUpdateLink={handleUpdateLink}
          linkError={linkError}
          linkTitle={linkTitle}
          linkUrl={linkUrl}
          linkedNotesForLink={linkedNotesForLink}
          links={links}
          listenSectionRef={listenSectionRef}
          openLinkMenuId={openLinkMenuId}
          previewYoutubeTitle={previewYoutubeTitle}
          previewYoutubeUrl={previewYoutubeUrl}
          savedLoopsForPreviewLink={savedLoopsForPreviewLink}
          savedLoops={savedLoops}
          scrollMarginTop={sectionScrollOffset}
          sectionNavId="section-listen"
          sessionUserId={session?.user?.id}
          setActiveLinkTabId={setActiveLinkTabId}
          setEditingLinkTitle={setEditingLinkTitle}
          setEditingLinkUrl={setEditingLinkUrl}
          setLinkError={setLinkError}
          setLinkTitle={setLinkTitle}
          setLinkUrl={setLinkUrl}
          setOpenLinkMenuId={setOpenLinkMenuId}
          skipLinkRowClickRef={skipLinkRowClickRef}
          youtubePreviewRef={youtubePreviewRef}
          isDemo={song?.is_demo}
        />

        <ReadSection
          addToast={addToast}
          editingPdfId={editingPdfId}
          editingPdfName={editingPdfName}
          effectiveActivePdfTabId={effectiveActivePdfTabId}
          globalViewMode={globalViewMode}
          handleCancelPdfEdit={handleCancelPdfEdit}
          handleDeletePdf={handleDeletePdf}
          handlePdfRowClick={handlePdfRowClick}
          handlePdfRowDoubleClick={handlePdfRowDoubleClick}
          handlePreviewPdf={handlePreviewPdf}
          handleRenamePdf={handleRenamePdf}
          handleUpdatePdfName={handleUpdatePdfName}
          handleUploadPdf={handleUploadPdf}
          linkedNotesForPdf={linkedNotesForPdf}
          maxPdfSizeBytes={MAX_PDF_SIZE_BYTES}
          openPdfInNewTab={openPdfInNewTab}
          openPdfMenuId={openPdfMenuId}
          pdfError={pdfError}
          pdfFile={pdfFile}
          pdfFiles={pdfFiles}
          pdfPreviewRef={pdfPreviewRef}
          previewPdfId={previewPdfId}
          previewPdfUrl={previewPdfUrl}
          readSectionRef={readSectionRef}
          scrollMarginTop={sectionScrollOffset}
          sectionNavId="read"
          sessionUserId={session?.user?.id}
          setActivePdfTabId={setActivePdfTabId}
          setEditingPdfName={setEditingPdfName}
          setOpenPdfMenuId={setOpenPdfMenuId}
          setPdfError={setPdfError}
          setPdfFile={setPdfFile}
          skipPdfRowClickRef={skipPdfRowClickRef}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />

        <RecordSection
          audioError={audioError}
          audioFile={audioFile}
          audioUploading={audioUploading}
          editingRecordingId={editingRecordingId}
          editingRecordingName={editingRecordingName}
          handleCancelRecordingEdit={handleCancelRecordingEdit}
          handleDeleteRecording={handleDeleteRecording}
          handlePreviewRecording={handlePreviewRecording}
          handleRenameRecording={handleRenameRecording}
          handleSaveRecording={handleSaveRecording}
          handleStartRecording={handleStartRecording}
          handleStopRecording={handleStopRecording}
          handleUpdateRecordingName={handleUpdateRecordingName}
          handleUploadAudio={handleUploadAudio}
          linkedNotesForAudio={linkedNotesForAudio}
          maxAudioSizeBytes={MAX_AUDIO_SIZE_BYTES}
          openRecordingMenuId={openRecordingMenuId}
          previewAudioId={previewAudioId}
          previewAudioUrl={previewAudioUrl}
          recordSectionRef={recordSectionRef}
          recording={recording}
          recordingAudioBlob={recordingAudioBlob}
          recordingName={recordingName}
          recordings={recordings}
          scrollMarginTop={sectionScrollOffset}
          sectionNavId="record"
          setAudioError={setAudioError}
          setAudioFile={setAudioFile}
          setEditingRecordingName={setEditingRecordingName}
          setOpenRecordingMenuId={setOpenRecordingMenuId}
          setRecordingName={setRecordingName}
        />

        <ThinkSection
          editingNoteContent={editingNoteContent}
          editingNoteId={editingNoteId}
          editingNoteLinkId={editingNoteLinkId}
          editingNotePdfId={editingNotePdfId}
          editingNoteRecordingId={editingNoteRecordingId}
          effectiveActiveNoteTabId={effectiveActiveNoteTabId}
          getNoteLabel={getNoteLabel}
          globalViewMode={globalViewMode}
          handleAddNote={handleAddNote}
          handleDeleteNote={handleDeleteNote}
          handleEditNote={handleEditNote}
          handleUpdateNote={handleUpdateNote}
          links={links}
          newNote={newNote}
          newNoteLinkId={newNoteLinkId}
          newNotePdfId={newNotePdfId}
          newNoteRecordingId={newNoteRecordingId}
          notes={notes}
          openNoteMenuId={openNoteMenuId}
          pdfFiles={pdfFiles}
          recordings={recordings}
          scrollMarginTop={sectionScrollOffset}
          sectionNavId="think"
          setActiveNoteTabId={setActiveNoteTabId}
          setEditingNoteContent={setEditingNoteContent}
          setEditingNoteId={setEditingNoteId}
          setEditingNoteLinkId={setEditingNoteLinkId}
          setEditingNotePdfId={setEditingNotePdfId}
          setEditingNoteRecordingId={setEditingNoteRecordingId}
          setNewNote={setNewNote}
          setNewNoteLinkId={setNewNoteLinkId}
          setNewNotePdfId={setNewNotePdfId}
          setNewNoteRecordingId={setNewNoteRecordingId}
          setOpenNoteMenuId={setOpenNoteMenuId}
          thinkSectionRef={thinkSectionRef}
        />

        <SetlistsSection
          effectiveActiveSetlistTabId={effectiveActiveSetlistTabId}
          globalViewMode={globalViewMode}
          handleAddSongToSetlist={handleAddSongToSetlist}
          handleCreateSetlistAndAdd={handleCreateSetlistAndAdd}
          newSetlistName={newSetlistName}
          scrollMarginTop={sectionScrollOffset}
          sectionNavId="setlists"
          selectedSetlistId={selectedSetlistId}
          sessionUserId={session?.user?.id}
          setActiveSetlistTabId={setActiveSetlistTabId}
          setNewSetlistName={setNewSetlistName}
          setSelectedSetlistId={setSelectedSetlistId}
          setlistError={setlistError}
          setlists={setlists}
          setlistsSectionRef={setlistsSectionRef}
          songSetlistIds={songSetlistIds}
        />
      </div>

    </div>
  )
}
