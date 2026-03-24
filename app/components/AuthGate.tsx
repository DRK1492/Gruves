'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSupabaseSession } from './SessionProvider'

const isPublicPath = (pathname: string) => pathname === '/' || pathname.startsWith('/auth')

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { loading, session } = useSupabaseSession()
  const isPublic = isPublicPath(pathname)
  const shouldRedirectToHome = !session && !isPublic
  const shouldRedirectAwayFromAuth = Boolean(session) && pathname.startsWith('/auth')

  useEffect(() => {
    if (loading) return

    if (shouldRedirectToHome) {
      router.replace('/auth')
    } else if (shouldRedirectAwayFromAuth) {
      router.replace('/')
    }
  }, [loading, router, shouldRedirectAwayFromAuth, shouldRedirectToHome])

  if (loading || shouldRedirectToHome || shouldRedirectAwayFromAuth) return null

  return <>{children}</>
}
