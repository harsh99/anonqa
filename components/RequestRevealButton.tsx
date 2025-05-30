'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Props {
  answerId: string
  currentUserId: string
  authorId: string
  revealStatus: boolean
  alreadyRequested: boolean
}

export function RequestRevealButton({
  answerId,
  currentUserId,
  authorId,
  revealStatus,
  alreadyRequested
}: Props) {
  const supabase = createClientComponentClient()
  const [requested, setRequested] = useState(alreadyRequested)

  async function handleRequestReveal() {
    if (requested) return

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

    setRequested(true)
  }

  const shouldShowButton =
    !revealStatus && currentUserId !== authorId

  if (!shouldShowButton) {
    return null
  }

  return (
    <button
      onClick={handleRequestReveal}
      disabled={requested || alreadyRequested}
      className="mt-2 text-sm text-blue-600 underline disabled:text-gray-400"
    >
      {(requested || alreadyRequested) ? 'Reveal Requested' : 'Request Reveal'}
    </button>
  )
}
