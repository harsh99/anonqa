'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { login } from './actions'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [state, formAction] = useFormState(login, { error: null, pending: false })

  if (!formAction) return <p>Loading...</p>

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {isSignUp ? 'Create an Account' : 'Log In'}
      </h1>

      <form action={formAction} method="POST" className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="w-full px-3 py-2 border rounded"
        />

        {state?.error && (
          <p className="text-red-600 text-sm">{state.error}</p>
        )}

        <button
  type="submit"
  disabled={state.pending}
>
  {state.pending ? 'Logging in...' : 'Login'}
</button>
      </form>

      <p className="mt-4 text-sm text-center">
        Don’t have an account?{' '}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-600 underline"
        >
          Sign up
        </button>
      </p>
    </div>
  )
}
