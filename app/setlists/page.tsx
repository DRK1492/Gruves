'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../components/SessionProvider'

interface Setlist {
  id: string
  name: string
  song_count: number
}

export default function SetlistsPage() {
  const router = useRouter()
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [newSetlistName, setNewSetlistName] = useState('')
  const [error, setError] = useState('')
  const { session } = useSupabaseSession()

  useEffect(() => {
    const fetchSetlists = async () => {
      if (!session?.user?.id) return

      const [{ data: setlistData, error: setlistError }, { data: countsData }] = await Promise.all([
        supabase
          .from('setlists')
          .select('id, name')
          .eq('user_id', session.user.id)
          .order('name', { ascending: true }),
        supabase
          .from('setlist_songs')
          .select('setlist_id')
          .eq('user_id', session.user.id),
      ])

      if (setlistError) {
        console.log(setlistError)
        return
      }

      const countMap: Record<string, number> = {}
      for (const row of countsData || []) {
        countMap[row.setlist_id] = (countMap[row.setlist_id] || 0) + 1
      }

      setSetlists(
        (setlistData || []).map(s => ({
          id: s.id,
          name: s.name,
          song_count: countMap[s.id] || 0,
        }))
      )
    }
    fetchSetlists()
  }, [session])

  const handleAddSetlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id || !newSetlistName.trim()) return
    setError('')
    const { data, error } = await supabase
      .from('setlists')
      .insert({ name: newSetlistName.trim(), user_id: session.user.id })
      .select()
      .single()
    if (error) {
      console.log('Error adding setlist:', error)
      setError('Could not add setlist. Try a different name.')
      return
    }
    if (data) {
      setSetlists(prev =>
        [...prev, { id: data.id, name: data.name, song_count: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      )
      setNewSetlistName('')
    }
  }

  return (
    <div className="page">
      <h1 className="text-3xl font-semibold tracking-tight mb-5 text-center">Setlists</h1>

      <p className="label mb-3">New Setlist</p>
      <div className="section-divider" />
      <form onSubmit={handleAddSetlist} className="setlist-add-form card p-4 mb-6">
        <input
          type="text"
          placeholder="Setlist name"
          value={newSetlistName}
          onChange={e => setNewSetlistName(e.target.value)}
          className="input flex-1"
        />
        <button type="submit" className="button-primary button-cta">
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {setlists.length === 0 ? (
        <div className="section-empty-state mt-8">
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            className="section-empty-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
          <p className="font-semibold text-base">No setlists yet</p>
          <p className="muted text-sm max-w-xs">
            Create your first setlist to organize songs for a gig or practice session.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {setlists.map(setlist => (
            <li
              key={setlist.id}
              className="row row-clickable setlist-list-card"
              onClick={() => router.push(`/setlists/${setlist.id}`)}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                className="setlist-list-icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span className="setlist-list-name">{setlist.name}</span>
              <span className="setlist-list-count">
                {setlist.song_count === 1 ? '1 song' : `${setlist.song_count} songs`}
              </span>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                className="setlist-list-chevron"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
