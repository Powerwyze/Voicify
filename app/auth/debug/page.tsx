'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthDebugPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string>('')
  const [sessionInfo, setSessionInfo] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setSessionInfo(JSON.stringify(data.session, null, 2))
    })()
  }, [])

  const signUp = async () => {
    setStatus('')
    const { error } = await supabase.auth.signUp({ email, password })
    setStatus(error ? `SignUp error: ${error.message}` : 'SignUp OK (check email if confirmations enabled)')
  }

  const signIn = async () => {
    setStatus('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setStatus(error ? `SignIn error: ${error.message}` : 'SignIn OK')
    const { data } = await supabase.auth.getSession()
    setSessionInfo(JSON.stringify(data.session, null, 2))
  }

  const signOut = async () => {
    setStatus('')
    const { error } = await supabase.auth.signOut()
    setStatus(error ? `SignOut error: ${error.message}` : 'Signed out')
    const { data } = await supabase.auth.getSession()
    setSessionInfo(JSON.stringify(data.session, null, 2))
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="text-2xl font-bold">Auth Debug</h1>

      <div className="w-full max-w-md space-y-3 border rounded-lg p-4">
        <label className="block text-sm">Email</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <label className="block text-sm">Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
        />
        <div className="flex gap-2 pt-2">
          <button onClick={signUp} className="px-3 py-2 border rounded">Sign Up</button>
          <button onClick={signIn} className="px-3 py-2 border rounded">Sign In</button>
          <button onClick={signOut} className="px-3 py-2 border rounded">Sign Out</button>
        </div>
        {status && <div className="text-sm">{status}</div>}
      </div>

      <div className="w-full max-w-2xl border rounded-lg p-4">
        <div className="font-mono text-xs whitespace-pre-wrap break-words">
          {sessionInfo || 'No session'}
        </div>
      </div>
    </main>
  )
}

