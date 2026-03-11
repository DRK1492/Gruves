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
  song_genres?: SongGenre[]
}

export interface Genre {
  id: string
  name: string
}

export interface Setlist {
  id: string
  name: string
}

export type SongsViewMode = 'board' | 'list'

export type SongStatusGroup = {
  key: 'confident' | 'learning' | 'wishlist'
  title: string
  songs: Song[]
  emptyCopy: string
  statusClass: string
}
