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
  isPending?: boolean
  is_demo?: boolean
  song_genres?: SongGenre[]
  created_at?: string
  view_count?: number
}

export type SortPreference = 'default' | 'newest' | 'most_viewed'

export interface Genre {
  id: string
  name: string
}

export interface Setlist {
  id: string
  name: string
}

export type SongStatusGroup = {
  key: 'confident' | 'learning' | 'wishlist'
  title: string
  songs: Song[]
  emptyCopy: string
  statusClass: string
}
