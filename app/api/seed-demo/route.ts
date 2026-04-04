import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has songs
    const { count } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) > 0) {
      // User already has songs, skip seeding
      return NextResponse.json({ message: 'User already has songs' }, { status: 200 })
    }

    // 1. Create demo song
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .insert([
        {
          user_id: user.id,
          title: 'Wish You Were Here',
          artist: 'Pink Floyd',
          status: 'learning',
          is_demo: true,
        },
      ])
      .select()
      .single()

    if (songError || !songData) {
      console.error('Error creating demo song:', songError)
      return NextResponse.json({ error: 'Failed to create demo song' }, { status: 500 })
    }

    const songId = songData.id

    // 2. Create Rock genre
    const { data: genreData, error: genreError } = await supabase
      .from('genres')
      .insert([
        {
          user_id: user.id,
          name: 'Rock',
        },
      ])
      .select()
      .single()

    if (genreError || !genreData) {
      console.error('Error creating demo genre:', genreError)
      // Continue anyway
    }

    const genreId = genreData?.id

    // 3. Link song to genre
    if (genreId) {
      const { error: linkError } = await supabase.from('song_genres').insert([
        {
          song_id: songId,
          genre_id: genreId,
          user_id: user.id,
        },
      ])

      if (linkError) {
        console.error('Error linking genre to song:', linkError)
      }
    }

    // 4. Create YouTube link
    const { data: linkData, error: linkError } = await supabase
      .from('song_links')
      .insert([
        {
          song_id: songId,
          user_id: user.id,
          title: 'Wish You Were Here – Pink Floyd (Official)',
          url: 'https://www.youtube.com/watch?v=IXdNnw99-Ic',
        },
      ])
      .select()
      .single()

    if (linkError || !linkData) {
      console.error('Error creating demo link:', linkError)
      // Continue anyway
    }

    const linkId = linkData?.id

    // 5. Create loop for the YouTube link
    if (linkId) {
      const { error: loopError } = await supabase.from('song_loops').insert([
        {
          song_id: songId,
          link_id: linkId,
          user_id: user.id,
          name: 'Intro fingerpicking pattern',
          loop_start: 14.0,
          loop_end: 48.0,
        },
      ])

      if (loopError) {
        console.error('Error creating demo loop:', loopError)
      }
    }

    // 6. Create note
    const { error: noteError } = await supabase.from('song_notes').insert([
      {
        song_id: songId,
        user_id: user.id,
        content:
          'Iconic two-guitar intro using D and G chord shapes with open strings ringing out. The main riff repeats throughout. Focus on the fingerpicking pattern before adding the chord changes. Try looping the intro section using the A/B player above to nail the timing.',
      },
    ])

    if (noteError) {
      console.error('Error creating demo note:', noteError)
    }

    // 7. Create setlist
    const { data: setlistData, error: setlistError } = await supabase
      .from('setlists')
      .insert([
        {
          user_id: user.id,
          name: 'My First Setlist',
        },
      ])
      .select()
      .single()

    if (setlistError || !setlistData) {
      console.error('Error creating demo setlist:', setlistError)
      // Continue anyway
    }

    const setlistId = setlistData?.id

    // 8. Add song to setlist
    if (setlistId) {
      const { error: setlistSongError } = await supabase.from('setlist_songs').insert([
        {
          setlist_id: setlistId,
          song_id: songId,
          user_id: user.id,
          position: 1,
        },
      ])

      if (setlistSongError) {
        console.error('Error adding song to setlist:', setlistSongError)
      }
    }

    return NextResponse.json({ message: 'Demo seeded successfully' }, { status: 200 })
  } catch (error) {
    console.error('Seed API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
