'use client'

import { useSession } from '@supabase/auth-helpers-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HeroSection() {
  const session = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || session) return null

  return (
    <section className="text-center mb-10">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">
        Welcome to <span className="text-orange-600">Doubtmatter.ai</span>
      </h1>
      <p className="text-gray-700 mb-4 text-base space-y-2">
        <ul>Ask questions anonymously. Get answers.</ul>
        <ul>Request reveals if you want to know who's behind the best ones.</ul>
        <ul>Feature on leaderboards.</ul>
      </p>
      <Link href="/signup">
        <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded shadow">
          Get Started
        </button>
      </Link>
    </section>
  )
} 
