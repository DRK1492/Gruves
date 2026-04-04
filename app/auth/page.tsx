'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../components/SessionProvider'

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { session } = useSupabaseSession()
  const initialMode = useMemo(() => {
    const modeParam = searchParams.get('mode')
    return modeParam === 'signup' ? 'signup' : 'signin'
  }, [searchParams])
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!email.trim() || !password.trim()) {
      setMessage('Please enter an email and password.')
      return
    }
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        }
      })
      if (error) {
        setMessage("Couldn't create account. Please try again.")
      } else if (data.user) {
        setMessage('✅ Account created. You can now sign in.')
        setMode('signin')
      }
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    if (error) {
      setMessage('Incorrect email or password. Please try again.')
    } else {
      setMessage(`✅ Logged in as ${data.user?.email ?? email}`)
      router.push('/')
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setMessage('Enter your email above first.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (error) {
      setMessage('⚠️ Could not send reset email. Please try again.')
    } else {
      setMessage('✅ Password reset email sent. Check your inbox.')
    }
  }
  return (
    <div className="page">
      <div className="card p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
      {!session ? (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="input w-full mb-4"
          />
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted hover:text-foreground transition"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {mode === 'signin' && (
            <div className="text-right mb-4">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-muted hover:text-foreground transition"
              >
                Forgot password?
              </button>
            </div>
          )}
          <button type="submit" className="button-primary w-full">
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
          <button
            type="button"
            className="button-ghost mt-3 w-full"
            onClick={() => {
              setMode(prev => (prev === 'signup' ? 'signin' : 'signup'))
              setMessage('')
            }}
          >
            {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create account'}
          </button>
        </form>
      ) : (
        <div>
          <p>✅ Logged in as {session.user.email}</p>
          <p className="muted mt-2">You can now navigate to your songs page.</p>
        </div>
      )}
      {message && (
        <p className={`mt-4 text-sm ${
          message.startsWith('✅')
            ? 'text-green-400'
            : 'text-red-400'
        }`}>
          {!message.startsWith('✅') && <span>⚠️ </span>}
          {message}
        </p>
      )}
      </div>
    </div>
  )
}
