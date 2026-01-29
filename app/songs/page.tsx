'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface Song {
  id: string
  title: string
  artist: string
  status: string
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [status, setStatus] = useState('learning')
  const [session, setSession] = useState<any>(null)

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
        .select('*')
        .eq('user_id', session.user.id)
      if (error) console.log(error)
      else setSongs(data as Song[])
      setLoading(false)
    }
    fetchSongs()
  }, [session])

  // Add new song (Optimistic Update)
  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    // Optimistic UI update
    const tempSong: Song = {
      id: crypto.randomUUID(),
      title,
      artist,
      status
    }
    setSongs(prev => [...prev, tempSong])

    const { data, error } = await supabase.from('songs').insert([
      {
        user_id: session.user.id,
        title,
        artist,
        status
      }
    ])

    if (error) {
      console.log('Error adding song:', error)
      // rollback optimistic update
      setSongs(prev => prev.filter(song => song.id !== tempSong.id))
    }

    setTitle('')
    setArtist('')
    setStatus('learning')
  }

  // Delete song
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('songs').delete().eq('id', id)
    if (error) console.log(error)
    else setSongs(prev => prev.filter(song => song.id !== id))
  }

  // Navigate to song detail page
  const goToSong = (id: string) => {
    window.location.href = `/songs/${id}`
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center">Your Songs</h1>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {songs.map(song => (
            <div
              key={song.id}
              className="bg-white border border-gray-200 shadow-md rounded-xl p-5 hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <h2 className="font-semibold text-lg mb-1">{song.title}</h2>
              <p className="text-gray-500 mb-2">{song.artist || 'Unknown Artist'}</p>
              <span className="inline-block px-2 py-1 text-xs font-medium uppercase text-white rounded-full bg-blue-600">
                {song.status}
              </span>
              <div className="mt-4 flex justify-between">
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow"
                  onClick={() => handleDelete(song.id)}
                >
                  Delete
                </button>
                <button
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 shadow"
                  onClick={() => goToSong(song.id)}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 mt-4">No songs yet. Add some!</p>
      )}

      {/* Add Song Form */}
      <h2 className="text-2xl font-semibold mt-10 mb-3">Add a New Song</h2>
      <form onSubmit={handleAddSong} className="flex flex-col gap-3 bg-white p-5 rounded-xl shadow-md">
        <input
          type="text"
          placeholder="Song Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Artist (optional)"
          value={artist}
          onChange={e => setArtist(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="known">Known</option>
          <option value="learning">Learning</option>
          <option value="wishlist">Wishlist</option>
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 shadow-md mt-2"
        >
          Add Song
        </button>
      </form>
    </div>
  )
}