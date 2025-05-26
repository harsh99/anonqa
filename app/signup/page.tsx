'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signupError) {
      setError(signupError.message)
      return
    }

    // 🔁 Wait briefly for session to be established
    let attempts = 0
    let sessionReady = false
    while (attempts < 5 && !sessionReady) {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        sessionReady = true
        break
      }
      attempts++
      await new Promise(res => setTimeout(res, 300))
    }

    // ✅ Redirect after confirming session is ready
    router.push('/')
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Sign Up
        </button>
      </form>
    </div>
  )
}