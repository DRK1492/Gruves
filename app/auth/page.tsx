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
    window.location.href = '/songs' // redirect to Songs page
  }
}
  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h1>Login / Signup</h1>
      {!session ? (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', margin: '1rem 0' }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>Send Magic Link</button>
        </form>
      ) : (
        <div>
          <p>✅ Logged in as {session.user.email}</p>
          <p>You can now navigate to your dashboard or songs page.</p>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  )
}