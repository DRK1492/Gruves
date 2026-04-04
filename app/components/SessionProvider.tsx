'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'

type SessionContextValue = {
  loading: boolean
  session: Session | null
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | null = null

    // Clear any stale tokens left in localStorage from the old createClient setup.
    // createBrowserClient (@supabase/ssr) uses cookies, not localStorage, so these
    // leftovers can cause "Refresh Token Not Found" errors — especially on Safari.
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key)
        }
      })
    }

    // Initialize session sequentially: load first, then subscribe.
    // Registering onAuthStateChange before getSession() resolves creates a race
    // where INITIAL_SESSION fires with null before the cookie-based session is
    // read — causing AuthGate to fire a premature redirect to /auth and then back
    // to / for authenticated users navigating to protected routes.
    const initialize = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(data.session)
      setLoading(false)

      if (!isMounted) return
      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (isMounted) setSession(nextSession)
      })
      unsubscribe = () => listener.subscription.unsubscribe()
    }

    void initialize()

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [])

  const value = useMemo(
    () => ({
      loading,
      session,
    }),
    [loading, session]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSupabaseSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSupabaseSession must be used within a SessionProvider')
  }
  return context
}
