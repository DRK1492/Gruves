'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useSupabaseSession } from './SessionProvider'

export default function UserMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { session } = useSupabaseSession()

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
        <Settings size={18} />
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
