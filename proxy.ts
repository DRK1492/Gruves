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

  // Try getUser() first for server-side JWT validation.
  // If it returns an error OR throws/times out, fall back to getSession()
  // (local cookie decode). This handles expired access tokens, network
  // failures, and Supabase service outages without incorrectly blocking
  // users who still have a valid refresh token.
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
    console.log('[MIDDLEWARE] getUser result:', { userId: user?.id, error: error?.message })

    // getUser() returns {data: null, error: JWTExpired} for expired tokens —
    // that's a normal return (not a throw), so the catch won't fire.
    // Fall back to getSession() so users with valid refresh tokens aren't blocked.
    if (!user || error) {
      console.log('[MIDDLEWARE] getUser returned no user or error, falling back to getSession')
      const sessionResult = await supabase.auth.getSession()
      user = sessionResult.data?.session?.user ?? null
      error = sessionResult.error
      console.log('[MIDDLEWARE] getSession fallback:', { userId: user?.id, error: error?.message })
    }
  } catch (e) {
    console.log('[MIDDLEWARE] getUser threw or timed out, falling back to getSession:', (e as Error).message)
    const sessionResult = await supabase.auth.getSession()
    user = sessionResult.data?.session?.user ?? null
    error = sessionResult.error
    console.log('[MIDDLEWARE] getSession fallback:', { userId: user?.id, error: error?.message })
  }

  if (!user) {
    console.log('[MIDDLEWARE] No user found, redirecting to /auth')
    const url = request.nextUrl.clone()
    // Preserve the original destination so AuthGate can send the user there
    // after they authenticate, instead of always bouncing them to /.
    const next = request.nextUrl.pathname
    url.pathname = '/auth'
    url.searchParams.set('next', next)
    return NextResponse.redirect(url)
  }

  console.log('[MIDDLEWARE] User authenticated, proceeding')
  return supabaseResponse
}

export const config = {
  matcher: ['/songs/:path*', '/setlists/:path*', '/settings/:path*'],
}
