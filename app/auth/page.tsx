'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    checkSession()

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'guitarguitar'
    })
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`✅ Logged in as ${data.user.email}`)
      window.location.href = '/songs'
    }
  }
  return (
    <div className="page">
      <div className="card p-6 max-w-md mx-auto">
        <p className="label mb-2">Access</p>
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Login / Signup</h1>
      {!session ? (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="input w-full mb-4"
          />
          <button type="submit" className="button-primary">Sign in</button>
        </form>
      ) : (
        <div>
          <p>✅ Logged in as {session.user.email}</p>
          <p className="muted mt-2">You can now navigate to your songs page.</p>
        </div>
      )}
      {message && <p className="mt-4">{message}</p>}
      </div>
    </div>
  )
}
