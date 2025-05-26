// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function middleware(req: NextRequest) {
  console.log('🔥 Middleware is running:', req.nextUrl.pathname)

  // 👇 This is required to properly load cookies in middleware
  req.cookies.getAll()

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  console.log('🧠 Supabase session in middleware:', session)
  if (error) console.error('❌ Supabase error:', error)

  return res
}

export const config = {
  matcher: [
    '/',                // homepage
    '/login',           // login page
    '/signup',          // signup page
    '/questions/:path*' // all questions pages
  ],
}