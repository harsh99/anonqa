'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'

interface Props {
  answerId: string
  currentUserId: string
  authorId: string
  revealStatus: boolean
  alreadyRequested: boolean
  totalRequests: number
}

export function RequestRevealButton({
  answerId,
  currentUserId,
  authorId,
  revealStatus,
  alreadyRequested,
  totalRequests
}: Props) {
  const supabase = createClientComponentClient()
  const [requested, setRequested] = useState(alreadyRequested)
  const [requestCount, setRequestCount] = useState<number>(totalRequests)
  const [hovered, setHovered] = useState(false)

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`reveal_requests_updates_${answerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reveal_requests',
          filter: `answer_id=eq.${answerId}`
        },
        async (payload) => {
          console.log('🔁 Real-time update for reveal_requests:', payload)

          // Re-fetch reveal request count and user-specific request
          const { data: requests, error } = await supabase
            .from('reveal_requests')
            .select('requested_by')
            .eq('answer_id', answerId)

          if (!error && requests) {
            setRequestCount(requests.length)
            setRequested(requests.some(r => r.requested_by === currentUserId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, answerId, currentUserId])

  async function handleRequestReveal() {
    if (requested) {
      // Cancel the request
      const { error: deleteRequestError } = await supabase
        .from('reveal_requests')
        .delete()
        .eq('answer_id', answerId)
        .eq('requested_by', currentUserId)

      if (deleteRequestError) {
        console.error('Failed to cancel reveal request:', deleteRequestError.message)
        return
      }

      setRequested(false)
      setRequestCount((prev) => Math.max(prev - 1, 0))
      
      await supabase
        .from('notifications')
        .delete()
        .eq('answer_id', answerId)
        .eq('user_id', authorId)
        .eq('type', 'reveal_request')
    } else {
      // Make the request
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

      setRequested(true)
      setRequestCount((prev) => prev + 1)
      
      await supabase
        .from('notifications')
        .insert({
          user_id: authorId,
          answer_id: answerId,
          type: 'reveal_request'
        })
    }
  }

  const shouldShowButton = !revealStatus && currentUserId !== authorId
  if (!shouldShowButton) return null

  const showCount = requestCount > 0
  const cancelSuffix = requested && hovered ? '  ×' : ''
  const buttonText = requested
    ? `Reveal Requested${showCount ? ` • ${requestCount} total` : ''}${cancelSuffix}`
    : 'Request Reveal'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex justify-start"
    >
      <button
        onClick={handleRequestReveal}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={requested ? 'Click to cancel your request' : ''}
        className={`text-sm px-4 py-1 rounded-full shadow transition-all
          ${
            requested
              ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              : 'bg-green-800 text-white hover:bg-green-600'
          }`}
      >
        {buttonText}
      </button>
    </motion.div>
  )
}