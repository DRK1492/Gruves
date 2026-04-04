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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session token if it's nearing expiry. This keeps auth cookies
  // up-to-date on the server side. Route protection is handled entirely
  // client-side by AuthGate — keeping redirects out of the middleware avoids
  // infinite redirect loops caused by cookie-read failures on the Edge Runtime.
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: ['/songs/:path*', '/setlists/:path*', '/settings/:path*'],
}
