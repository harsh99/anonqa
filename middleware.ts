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

  // Test cookie on the base page only. Not httpOnly, so it's visible in
  // document.cookie and in the Set-Cookie response header.
  if (req.nextUrl.pathname === '/') {
    res.cookies.set('test_cookie', 'maciek', { path: '/' })
    res.cookies.set('second_cookie', 'harsh', { path: '/' })
  }

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