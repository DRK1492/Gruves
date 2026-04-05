'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSupabaseSession } from './SessionProvider'

const isPublicPath = (pathname: string) =>
  pathname === '/' || pathname.startsWith('/auth') || pathname === '/privacy' || pathname === '/terms'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { loading, session } = useSupabaseSession()
  const isPublic = isPublicPath(pathname)
  const shouldRedirectToAuth = !session && !isPublic
  const shouldRedirectAwayFromAuth = Boolean(session) && pathname.startsWith('/auth')

  useEffect(() => {
    if (loading) return

    if (shouldRedirectToAuth) {
      // Pass the current path as ?next= so the user returns here after auth,
      // instead of always landing on / when the redirect resolves.
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`)
    } else if (shouldRedirectAwayFromAuth) {
      // Read ?next= from the URL. This handles both legitimate post-login
      // redirects and cases where the middleware incorrectly sent an
      // authenticated user to /auth — either way they land at their target.
      const next = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next')
        : null
      const destination = next && next.startsWith('/') ? decodeURIComponent(next) : '/'
      router.replace(destination)
    }
  }, [loading, pathname, router, shouldRedirectAwayFromAuth, shouldRedirectToAuth])

  if (loading || shouldRedirectToAuth || shouldRedirectAwayFromAuth) return null

  return <>{children}</>
}
