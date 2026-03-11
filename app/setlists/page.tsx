'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../components/SessionProvider'

interface Setlist {
  id: string
  name: string
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
      setSetlists(prev => [...prev, data as Setlist].sort((a, b) => a.name.localeCompare(b.name)))
      setNewSetlistName('')
    }
  }

  return (
    <div className="page">
      <p className="label text-center mb-2">Showtime</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-5 text-center">Setlists</h1>

      <div className="section-title">
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <h2 className="text-2xl font-semibold">New setlist</h2>
      </div>
      <div className="section-divider" />
      <form onSubmit={handleAddSetlist} className="flex gap-2 mb-4 card p-4">
        <input
          type="text"
          placeholder="New setlist name"
          value={newSetlistName}
          onChange={e => setNewSetlistName(e.target.value)}
          className="input flex-1"
        />
        <button
          type="submit"
          className="button-primary"
        >
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {setlists.length === 0 ? (
        <p className="text-center muted">No setlists yet.</p>
      ) : (
        <ul className="space-y-2">
          {setlists.map(setlist => (
            <li
              key={setlist.id}
              className="row row-clickable flex justify-between items-center"
              onClick={() => router.push(`/setlists/${setlist.id}`)}
            >
              <span className="font-medium">{setlist.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
