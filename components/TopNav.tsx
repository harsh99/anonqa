'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import NotificationsDropdown from './NotificationsDropdown'

export default function TopNav() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()

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
    <nav className={navBaseClass}>
      {/* Left: Home | Ask */}
      <div className="flex space-x-4">
        <Link href="/home" className={linkClass}>
          Home
        </Link>
        <span className="text-gray-500">|</span>
        <Link href="/ask" className={linkClass}>
          Ask
        </Link>
      </div>

      {/* Center: Logged in as */}
      <div className="text-sm text-center text-gray-300">
        ✅ Logged in as{' '}
        <span className="font-semibold text-white">{userEmail}</span>{' '}
        <button onClick={handleLogout} className="ml-2 underline text-blue-300 hover:text-white">
          Log out
        </button>
      </div>

      {/* Right: Notifications bell */}
      <div>
        <NotificationsDropdown />
      </div>
    </nav>
  )
}
