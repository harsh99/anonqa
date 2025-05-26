'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type LoginState = {
  error: string | null
  pending: boolean
}

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email')?.toString()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    return { error: 'Email and password are required', pending: false }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message, pending: false }
  }

  redirect('/') // this will exit the action early and perform redirect
}