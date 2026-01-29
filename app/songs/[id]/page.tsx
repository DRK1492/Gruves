'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function SongDetail() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [song, setSong] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSong = async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error(error)
      } else {
        setSong(data)
        setNotes(data.notes || '')
      }
    }

    fetchSong()
  }, [id])

  const handleSaveNotes = async () => {
    setSaving(true)

    const { error } = await supabase
      .from('songs')
      .update({ notes })
      .eq('id', id)

    if (error) {
      console.error('Error saving notes:', error)
    }

    setSaving(false)
  }

  const handleDeleteNotes = async () => {
    const confirmed = confirm('Are you sure you want to delete these notes?')
    if (!confirmed) return

    const { error } = await supabase
      .from('songs')
      .update({ notes: null })
      .eq('id', id)

    if (!error) {
      setNotes('')
    }
  }

  if (!song) return <p className="p-4">Loading...</p>

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow-xl rounded-xl mt-8">

      {/* BACK BUTTON */}
      <button
        onClick={() => router.push('/songs')}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Back to Songs
      </button>

      <h1 className="text-3xl font-bold mb-1">{song.title}</h1>
      <p className="text-gray-600 mb-2">{song.artist || 'Unknown Artist'}</p>

      <span className="inline-block mb-6 px-3 py-1 text-xs font-semibold uppercase rounded-full bg-blue-600 text-white">
        {song.status}
      </span>

      {/* NOTES SECTION */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Practice Notes</h2>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Write your practice notes here..."
          className="w-full min-h-[180px] border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-3 mt-3">
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 shadow disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Notes'}
          </button>

          {notes && (
            <button
              onClick={handleDeleteNotes}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 shadow"
            >
              Delete Notes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}