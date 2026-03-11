import type { Dispatch, SetStateAction } from 'react'

export interface Song {
  id: string
  title: string
  artist: string
  status: string
}

export interface SetlistSongRow {
  song_id: string
  position: number | null
  songs: Song | null
}

export interface SetlistNote {
  id: string
  content: string
  created_at: string
}

export type Setter<T> = Dispatch<SetStateAction<T>>
