import type { Dispatch, SetStateAction } from 'react'

export interface SongGenre {
  genre_id: string
  genres: {
    name: string
  } | null
}

export interface Song {
  id: string
  title: string
  artist: string
  status: string
  song_genres?: SongGenre[]
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
