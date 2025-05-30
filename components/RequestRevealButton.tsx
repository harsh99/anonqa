'use client'

import { useEffect, useState } from 'react'
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
  const [requestCount, setRequestCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchRevealRequestCount() {
      const { count, error } = await supabase
        .from('reveal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('answer_id', answerId)

      if (!error) {
        setRequestCount(count ?? 0)
      }
    }

    if (!revealStatus && currentUserId !== authorId) {
      fetchRevealRequestCount()
    }
  }, [supabase, answerId, revealStatus, currentUserId, authorId])

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
    setRequestCount((prev) => (prev !== null ? prev + 1 : 1))
  }

  const shouldShowButton =
    !revealStatus && currentUserId !== authorId

  if (!shouldShowButton) {
    return null
  }

  // Only show count if total reveal requests > 1
  const showCount = requestCount !== null && requestCount > 1

  const buttonText =
    (requested || alreadyRequested)
      ? `Reveal Requested${showCount ? ` | Total ${requestCount}` : ''}`
      : 'Request Reveal'

  return (
    <button
      onClick={handleRequestReveal}
      disabled={requested || alreadyRequested}
      className="mt-2 text-sm text-blue-600 underline disabled:text-gray-400"
    >
      {buttonText}
    </button>
  )
}