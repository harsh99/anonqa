'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import NotificationsDropdown from './NotificationsDropdown'
import { Menu, X } from 'lucide-react'

export default function TopNav() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const userEmail = session?.user?.email ?? null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  const navBaseClass =
    'flex flex-wrap items-center justify-between w-full px-4 py-2 border-b border-gray-700 bg-gray-900 shadow-sm'
  const linkClass =
    'text-blue-300 hover:text-white underline transition-colors'
  const textClass = 'text-gray-300 text-sm'

  if (pathname === '/login' || pathname === '/signup' || pathname === '/questions') {
    return (
      <div className={navBaseClass}>
        <div className="mx-auto text-sm text-gray-400 flex items-center space-x-2">
          <span>👋 Welcome to</span>
          <Link
            href="/about"
            className="bg-orange-600 text-white font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-orange-700 transition-colors"
          >
            Doubtmatter.ai
          </Link>
          <div></div>
          <Link href="/" className={linkClass}>
            Back to base
          </Link>
        </div>
      </div>
    )
  }

  if (pathname === '/about' && !userEmail){
    return (
      <div className={navBaseClass}>
        <div className="mx-auto text-sm text-gray-400 flex items-center space-x-2">
          <span>👋 Welcome to</span>
          <Link
            href="/about"
            className="bg-orange-600 text-white font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-orange-700 transition-colors"
          >
            Doubtmatter.ai
          </Link>
          <div></div>
          <Link href="/" className={linkClass}>
            Back to base
          </Link>
        </div>
      </div>
    )
  }

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
      {/* Left: Hamburger + Nav Links */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden text-gray-300 hover:text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex space-x-3">
          <button
            onClick={() => {
              if (pathname === '/home') window.location.reload()
              else router.push('/home')
            }}
            className={linkClass}
          >
            Home
          </button>
          <span className="text-gray-500">|</span>
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <span className="text-gray-500">|</span>
          <Link href="/ask" className={linkClass}>
            Ask
          </Link>
          <span className="text-gray-500">|</span>
          <Link href="/my-questions" className={linkClass}>
            My Questions
          </Link>
        </div>
      </div>

      {/* Center: Stylized Brand Name */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold tracking-wide text-orange-300">
        Doubtmatter.ai
      </div>

      {/* Right: Logged in, Notifications, Logout */}
      <div className="flex items-center space-x-4 mt-2 sm:mt-0">
        <span className="text-gray-300 text-1x1 whitespace-nowrap hidden md:inline">
          ✅ Hey there,{' '}
          <span className="text-white font-semibold">{userEmail.split('@')[0]}</span>
        </span>
        <NotificationsDropdown />
        <button onClick={handleLogout} className={`${linkClass} hidden sm:inline`}>
          Log out
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
      <>
        {/* Overlay */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
        />
        <div className="fixed top-14 items-start left-0 z-50 w-60 bg-gray-800 shadow-lg rounded-lg p-4 flex flex-col space-y-2 md:hidden">
          <div className="text-sm text-white mb-2 font-medium">
            Hi, <span className="font-semibold">{userEmail.split('@')[0]}</span>
          </div>
          <button
            onClick={() => {
              setMobileMenuOpen(false)
              if (pathname === '/home') window.location.reload()
              else router.push('/home')
            }}
            className={linkClass}
          >
            Home
          </button>
          <Link href="/about" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
            About
          </Link>
          <Link href="/ask" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
            Ask
          </Link>
          <Link href="/my-questions" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
            My Questions
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false)
              handleLogout()
            }}
            className={linkClass}
          >
            Log out
          </button>
        </div>
      </>
      )}
    </nav>
  )
}