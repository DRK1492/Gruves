import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  console.log('[MIDDLEWARE] Processing request:', request.nextUrl.pathname)
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          console.log('[MIDDLEWARE] Setting cookies:', cookiesToSet.map(c => c.name))
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Try getUser() first for token refresh capability
  // If it fails (network error, timeout, etc.), fall back to getSession()
  let user = null
  let error = null

  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('getUser timeout')), 5000)
      )
    ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>

    user = result.data?.user ?? null
    error = result.error
    console.log('[MIDDLEWARE] getUser succeeded:', { userId: user?.id })
  } catch (e) {
    console.log('[MIDDLEWARE] getUser failed, falling back to getSession:', (e as Error).message)
    // Fallback to getSession for faster, local JWT decode
    const sessionResult = await supabase.auth.getSession()
    user = sessionResult.data?.session?.user ?? null
    error = sessionResult.error
    console.log('[MIDDLEWARE] getSession fallback:', { userId: user?.id, error: error?.message })
  }

  if (!user) {
    console.log('[MIDDLEWARE] No user found, redirecting to /auth')
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  console.log('[MIDDLEWARE] User authenticated, proceeding')
  return supabaseResponse
}

export const config = {
  matcher: ['/songs/:path*', '/setlists/:path*', '/settings/:path*'],
}
