'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const tokenHash = url.searchParams.get('token_hash')
      const type = url.searchParams.get('type')

      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      } else if (tokenHash && type) {
        await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' })
      }

      router.replace('/')
    }

    void run()
  }, [router])

  return (
    <div className="page">
      <div className="card p-6 max-w-md mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin"></div>
        </div>
        <p className="text-muted">Signing you in…</p>
      </div>
    </div>
  )
}
