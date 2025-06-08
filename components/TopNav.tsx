'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import NotificationsDropdown from './NotificationsDropdown'

export default function TopNav() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const pathname = usePathname()

  const userEmail = session?.user?.email ?? null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  const navBaseClass =
    'flex justify-between items-center px-6 py-3 border-b border-gray-700 bg-gray-900 shadow-sm max-w-4xl mx-auto'
  const linkClass = 'text-blue-300 hover:text-white underline transition-colors'
  const textClass = 'text-gray-300'

  if (!userEmail) {
    return (
      <div className={navBaseClass}>
        <div></div>
        <div className={textClass}>
          ❌ You are not logged in{' '}
          <Link href="/login" className={linkClass}>
            Log in
          </Link>{' '}
          |{' '}
          <Link href="/signup" className={linkClass}>
            Sign up
          </Link>
        </div>
        <div></div>
      </div>
    )
  }

  return (
    <nav className={`${navBaseClass} relative`}>
      {/* Left: Home | Ask | My Questions */}
      <div className="flex space-x-3">
        <button
          onClick={() => {
            if (pathname === '/home') {
              window.location.reload()
            } else {
              router.push('/home')
            }
          }}
          className={linkClass}
        >
          Home
        </button>
        <span className="text-gray-500">|</span>
        <Link href="/ask" className={linkClass}>
          Ask
        </Link>
        <span className="text-gray-500">|</span>
        <Link href="/my-questions" className={linkClass}>
          My Questions
        </Link>
      </div>

      {/* Center: Logged in as... */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-sm text-gray-300 whitespace-nowrap">
        ✅ Logged in as{' '}
        <span className="font-semibold text-white">{userEmail}</span>{' '}
        
      </div>

      {/* Right: Notifications */}
      <div className="flex items-center">
        <NotificationsDropdown />
        <button
          onClick={handleLogout}
          className="ml-2 underline text-blue-300 hover:text-white"
        >
          Log out
        </button>
      </div>
    </nav>
  )

}
