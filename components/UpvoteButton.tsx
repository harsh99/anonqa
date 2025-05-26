'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function UpvoteButton({
  answerId,
  initialCount,
  voted: initiallyVoted = false,
}: {
  answerId: string
  initialCount: number
  voted?: boolean
}) {
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(initiallyVoted)
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()

  const toggleVote = async () => {
    if (loading) return
    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch(`/api/upvote`, {
  method: voted ? 'DELETE' : 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      Authorization: `Bearer ${session.access_token}`,
    }),
  },
  body: JSON.stringify({ answerId }),
})

    if (res.ok) {
      setCount((prev) => prev + (voted ? -1 : 1))
      setVoted(!voted)
    } else {
      const { error } = await res.json()
      console.error('Vote failed:', error)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggleVote}
      disabled={loading}
      className={`text-sm ${
        voted ? 'text-gray-500' : 'text-blue-600'
      } hover:underline disabled:opacity-50`}
    >
      {voted ? '▲ Voted' : '▲ Upvote'} ({count})
    </button>
  )
}