import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
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
          // Write new cookies onto the request so downstream code sees them,
          // then rebuild supabaseResponse so the browser receives the updated
          // token pair (critical for the refresh-token rotation flow on Vercel).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() calls Supabase's auth server to validate the access token.
  // When the access token is expired, the client automatically exchanges
  // the refresh token for a new session and setAll above persists it to
  // the response cookies — so the browser stays logged in transparently.
  // Only redirect to /auth when there is genuinely no valid session at all.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/songs/:path*', '/setlists/:path*', '/settings/:path*'],
}
