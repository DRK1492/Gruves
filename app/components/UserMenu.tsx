'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function UserMenu() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.menu-container')) return
      setOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [open])

  if (!session) return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
  }

  const handleNavigate = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <div className="menu-container">
      <button
        type="button"
        className="button-ghost menu-trigger"
        onClick={event => {
          event.stopPropagation()
          setOpen(prev => !prev)
        }}
        aria-label="Settings"
      >
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path
            d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M4.7 12a7.3 7.3 0 0 1 .07-1l-1.9-1.1 1.7-3 2.1.7a7.6 7.6 0 0 1 1.7-1l.3-2.2h3.4l.3 2.2a7.6 7.6 0 0 1 1.7 1l2.1-.7 1.7 3-1.9 1.1a7.3 7.3 0 0 1 0 2l1.9 1.1-1.7 3-2.1-.7a7.6 7.6 0 0 1-1.7 1l-.3 2.2h-3.4l-.3-2.2a7.6 7.6 0 0 1-1.7-1l-2.1.7-1.7-3 1.9-1.1a7.3 7.3 0 0 1-.07-1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="menu" onClick={event => event.stopPropagation()}>
          <div className="menu-label">
            Signed in as
            <span className="menu-email">{session.user.email ?? 'User'}</span>
          </div>
          <button type="button" className="menu-item" onClick={() => handleNavigate('/settings')}>
            Settings
          </button>
          <button type="button" className="menu-item" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
