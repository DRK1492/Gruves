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

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(data.session)
      setLoading(false)
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
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
