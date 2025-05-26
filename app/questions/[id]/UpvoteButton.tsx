'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UpvoteButton({ answerId }: { answerId: string }) {
  const supabase = createClient()
  const [submitted, setSubmitted] = useState(false)

  const upvote = async () => {
    const localVotes = JSON.parse(localStorage.getItem('voted_answers') || '[]')
    if (localVotes.includes(answerId)) {
      alert('You already voted on this answer.')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('answer_votes').insert({
      answer_id: answerId,
      user_id: user?.id || null,
    })

    if (error) {
      if (error.code === '23505') {
        alert('You already voted on this answer.')
      } else {
        alert('Vote failed: ' + error.message)
      }
      return
    }

    if (!user) {
      const updatedVotes = [...localVotes, answerId]
      localStorage.setItem('voted_answers', JSON.stringify(updatedVotes))
    }

    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 600)
  }

  return (
    <button
      onClick={upvote}
      className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      {submitted ? 'Voted!' : 'Upvote'}
    </button>
  )
}