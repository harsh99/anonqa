'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Props {
  answerId: string
  currentUserId: string
  authorId: string
  revealStatus: boolean
}

export function RequestRevealButton({
  answerId,
  currentUserId,
  authorId,
  revealStatus
}: Props) {
  const supabase = createClientComponentClient()
  const [alreadyRequested, setAlreadyRequested] = useState(false)
  const [requested, setRequested] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkIfAlreadyRequested() {
      const { data, error } = await supabase
        .from('reveal_requests')
        .select('id')
        .eq('answer_id', answerId)
        .eq('requested_by', currentUserId)
        .single()

      if (data) setAlreadyRequested(true)
      setLoading(false)
    }

    if (currentUserId && !revealStatus) {
      checkIfAlreadyRequested()
    }
  }, [answerId, currentUserId, revealStatus, supabase])

  async function handleRequestReveal() {
    setRequested(true)

    // Step 1: Insert into reveal_requests
    const { error: requestError } = await supabase
      .from('reveal_requests')
      .insert({
        answer_id: answerId,
        requested_by: currentUserId
      })

    if (requestError) {
      console.error('Failed to create reveal request:', requestError.message)
      return
    }

    // Step 2: Insert notification for author
    const { error: notifyError } = await supabase
      .from('notifications')
      .insert({
        user_id: authorId,
        answer_id: answerId,
        type: 'reveal_request'
      })

    if (notifyError) {
      console.error('Failed to create notification:', notifyError.message)
    }
  }

  if (
    loading ||
    revealStatus ||
    currentUserId === authorId ||
    alreadyRequested
  ) {
    return null
  }

  return (
    <button
      onClick={handleRequestReveal}
      disabled={requested}
      className="mt-2 text-sm text-blue-600 underline"
    >
      {requested ? 'Reveal Requested' : 'Request Reveal'}
    </button>
  )
}
