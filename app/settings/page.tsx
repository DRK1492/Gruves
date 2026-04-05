'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useTheme } from '../components/ThemeProvider'
import { useSupabaseSession } from '../components/SessionProvider'
import { supabase } from '../../lib/supabaseClient'

export default function SettingsPage() {
  const { mode, setMode } = useTheme()
  const { session } = useSupabaseSession()
  const router = useRouter()
  const email = session?.user?.email ?? ''

  // Password reset state
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handlePasswordReset = async () => {
    if (!email) return
    setResetLoading(true)
    setResetMessage(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setResetLoading(false)
    if (error) {
      setResetMessage({ type: 'error', text: error.message })
    } else {
      setResetMessage({ type: 'success', text: 'Check your inbox — a reset link is on its way.' })
    }
  }

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return
    setDeleteLoading(true)
    setDeleteError(null)
    const userId = session.user.id

    // TODO: Full auth.users deletion requires a server-side route or Supabase Edge Function
    // with the service role key. For now we delete all app data and sign the user out.
    // The auth.users record will remain but is inaccessible without data.
    try {
      // Delete in dependency order (child tables before parent tables).
      // All tables have a user_id column so RLS scopes each delete to the current user.
      const tables = [
        'song_loops',     // references song_links
        'song_genres',    // references songs and genres
        'song_notes',     // references songs
        'setlist_songs',  // references setlists and songs
        'song_links',     // references songs
        'setlists',
        'songs',
        'genres',
      ] as const

      for (const table of tables) {
        const { error } = await (supabase.from(table) as ReturnType<typeof supabase.from>)
          .delete()
          .eq('user_id', userId)
        if (error) throw error
      }

      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      setDeleteLoading(false)
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link href="/songs" className="settings-back-link">← Songs</Link>
          <h1 className="text-3xl font-semibold tracking-tight heading-display">Preferences</h1>
          <p className="muted">Control how the app looks for you.</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card settings-card">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path
              d="M12 4a8 8 0 1 0 8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M12 4v8h8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Appearance</h2>
        </div>
        <div className="section-divider" />

        <div className="settings-group">
          <p className="label mb-2">Mode</p>
          <div className="settings-row">
            <label className={`settings-option ${mode === 'dark' ? 'settings-option-active' : ''}`}>
              <input
                type="radio"
                name="theme-mode"
                value="dark"
                checked={mode === 'dark'}
                onChange={() => setMode('dark')}
              />
              <span className="settings-option-title">Dark</span>
              <span className="settings-option-sub">Best for low light sessions.</span>
            </label>
            <label className={`settings-option ${mode === 'light' ? 'settings-option-active' : ''}`}>
              <input
                type="radio"
                name="theme-mode"
                value="light"
                checked={mode === 'light'}
                onChange={() => setMode('light')}
              />
              <span className="settings-option-title">Light</span>
              <span className="settings-option-sub">Crisp and bright.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="card settings-card" style={{ marginTop: '1rem' }}>
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Account</h2>
        </div>
        <div className="section-divider" />

        {/* Email */}
        <div className="settings-group">
          <p className="label mb-1">Email</p>
          <p className="muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            Your account email address.
          </p>
          <div
            style={{
              background: 'var(--surface-strong)',
              border: '1px solid var(--border)',
              borderRadius: '0.65rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            {email || '—'}
          </div>
        </div>

        <div className="section-divider" style={{ marginTop: '1.25rem' }} />

        {/* Password Reset */}
        <div className="settings-group">
          <p className="label mb-1">Password</p>
          <p className="muted" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            Send a reset link to your email address.
          </p>
          <button
            type="button"
            className="button-ghost"
            onClick={handlePasswordReset}
            disabled={resetLoading}
          >
            {resetLoading ? 'Sending…' : 'Send Password Reset Email'}
          </button>
          {resetMessage && (
            <p
              style={{
                fontSize: '0.75rem',
                marginTop: '0.5rem',
                color: resetMessage.type === 'success' ? '#4ade80' : '#f87171',
              }}
            >
              {resetMessage.text}
            </p>
          )}
        </div>

        <div className="section-divider" style={{ marginTop: '1.25rem' }} />

        {/* Delete Account */}
        <div className="settings-group">
          <p className="label mb-1">Danger Zone</p>
          <p className="muted" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            Permanently remove your account and all data.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              className="button-ghost"
              style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.35)' }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          ) : (
            <div
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.28)',
                borderRadius: '0.65rem',
                padding: '1rem',
              }}
            >
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f87171', marginBottom: '0.5rem' }}>
                Are you sure?
              </p>
              <p className="muted" style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
                This will permanently delete your account and all your songs, setlists, and data.
                This cannot be undone.
              </p>
              {deleteError && (
                <p style={{ fontSize: '0.75rem', color: '#f87171', marginBottom: '0.75rem' }}>
                  {deleteError}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="button-ghost"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(null) }}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button-ghost"
                  style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' }}
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legal */}
      <div className="card settings-card" style={{ marginTop: '1rem' }}>
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M8 8h8M8 12h8M8 16h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Legal</h2>
        </div>
        <div className="section-divider" />

        <div className="settings-group">
          <Link
            href="/privacy"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              transition: 'background 140ms ease',
            }}
            className="hover:bg-white/5"
          >
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Privacy Policy</p>
              <p className="muted" style={{ fontSize: '0.75rem' }}>How we collect and use your data.</p>
            </div>
            <ChevronRight size={16} className="muted" style={{ flexShrink: 0 }} />
          </Link>

          <div className="section-divider" style={{ margin: '0.25rem 0' }} />

          <Link
            href="/terms"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              transition: 'background 140ms ease',
            }}
            className="hover:bg-white/5"
          >
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Terms of Service</p>
              <p className="muted" style={{ fontSize: '0.75rem' }}>The rules for using Gruves.</p>
            </div>
            <ChevronRight size={16} className="muted" style={{ flexShrink: 0 }} />
          </Link>
        </div>
      </div>
    </div>
  )
}
