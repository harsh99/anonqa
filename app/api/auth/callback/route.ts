// app/api/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // This exchanges the code in the URL for a session and sets the cookie
  await supabase.auth.exchangeCodeForSession(request.url)

  return NextResponse.redirect(new URL('/', request.url))
}