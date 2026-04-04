'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function seedDemoSong(userId: string) {
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

  try {
    console.log('[SEED] Checking if user has songs...')
    const { count } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if ((count ?? 0) > 0) {
      console.log('[SEED] User already has songs, skipping')
      return
    }

    console.log('[SEED] Creating demo song...')
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .insert([
        {
          user_id: userId,
          title: 'Wish You Were Here',
          artist: 'Pink Floyd',
          status: 'learning',
          is_demo: true,
        },
      ])
      .select()
      .single()

    if (songError || !songData) {
      console.error('[SEED] Error creating demo song:', songError)
      return
    }

    const songId = songData.id

    console.log('[SEED] Creating genre...')
    const { data: genreData, error: genreError } = await supabase
      .from('genres')
      .insert([{ user_id: userId, name: 'Rock' }])
      .select()
      .single()

    if (!genreError && genreData) {
      console.log('[SEED] Linking genre to song...')
      await supabase.from('song_genres').insert([
        {
          song_id: songId,
          genre_id: genreData.id,
          user_id: userId,
        },
      ])
    }

    console.log('[SEED] Creating YouTube link...')
    const { data: linkData, error: linkError } = await supabase
      .from('song_links')
      .insert([
        {
          song_id: songId,
          user_id: userId,
          title: 'Wish You Were Here – Pink Floyd (Official Audio)',
          url: 'https://www.youtube.com/watch?v=IXdNnw99-Ic',
        },
      ])
      .select()
      .single()

    if (!linkError && linkData) {
      console.log('[SEED] Creating loop...')
      await supabase.from('song_loops').insert([
        {
          song_id: songId,
          link_id: linkData.id,
          user_id: userId,
          name: 'Guitar riff after the intro',
          loop_start: 41.0,
          loop_end: 49.0,
        },
      ])

      console.log('[SEED] Creating note...')
      await supabase.from('song_notes').insert([
        {
          song_id: songId,
          user_id: userId,
          content:
            'Iconic two-guitar intro using D and G chord shapes with open strings ringing out. Focus on the fingerpicking pattern before adding chord changes. Use the A/B loop player above to isolate and repeat the intro section.',
        },
      ])
    }

    console.log('[SEED] Creating setlist...')
    const { data: setlistData, error: setlistError } = await supabase
      .from('setlists')
      .insert([{ user_id: userId, name: 'My First Setlist' }])
      .select()
      .single()

    if (!setlistError && setlistData) {
      console.log('[SEED] Adding song to setlist...')
      await supabase.from('setlist_songs').insert([
        {
          setlist_id: setlistData.id,
          song_id: songId,
          user_id: userId,
          position: 1,
        },
      ])
    }

    console.log('[SEED] Demo seeding completed successfully')
  } catch (error) {
    console.error('[SEED] Error:', error)
  }
}
