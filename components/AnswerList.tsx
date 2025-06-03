'use client'

import { useEffect, useState } from 'react'
import UpvoteButton from './UpvoteButton'
import { RequestRevealButton } from './RequestRevealButton'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Answer {
  id: string
  content: string
  created_at: string
  user_id: string
  reveal_status: boolean
  votes_count: number
  voted: boolean
  reveal_requested?: boolean
  reveal_request_count?: number
  author_name?: string
  revealed_at?: string | null
  users?: {
    username: string
  }
}

interface Props {
  answers: Answer[]
  votedAnswerIds?: string[]
  currentUserId: string
}

function formatRelativeOrExactTime(utcString: string): string {
  if (!utcString) return 'just now'
  const utcDate = new Date(utcString.endsWith('Z') ? utcString : utcString + 'Z')
  if (isNaN(utcDate.getTime())) return 'just now'
  const now = new Date()
  const diffMs = now.getTime() - utcDate.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)

  if (diffSec < 60) return `${diffSec} seconds ago`
  if (diffMin < 60) return `${diffMin} minutes ago`
  if (diffHr < 24) return `${diffHr} hours ago`
  return utcDate.toLocaleString()
}

export default function AnswerList({ answers: initialAnswers, votedAnswerIds = [], currentUserId }: Props) {
  const [answers, setAnswers] = useState(initialAnswers)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const answerIds = answers.map(a => a.id)
    const channel = supabase.channel('reveal-identity-channel')

    // Listen for updates on answers table
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'answers' },
      async (payload) => {
        const updated = payload.new as Answer

        // If identity revealed but no author name yet, fetch it
        if (updated.reveal_status && !updated.author_name) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('username')
            .eq('id', updated.user_id)
            .single()

          if (!error) {
            updated.author_name = userData.username
          }
        }

        setAnswers(prev =>
          prev.map(a => a.id === updated.id ? { ...a, ...updated } : a)
        )
      }
    )

    // Listen for any change on reveal_requests table relevant to current answers
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reveal_requests' },
      (payload) => {
        const newReq = payload.new
        const oldReq = payload.old

        // Check if change relates to one of the displayed answers
        if (!answerIds.includes(newReq?.answer_id) && !answerIds.includes(oldReq?.answer_id)) {
          return
        }

        // Refetch reveal_request_count for affected answers
        async function refreshRevealRequestCounts() {
          const { data, error } = await supabase
            .from('reveal_request_counts_view')
            .select('*')
            .in('answer_id', answerIds)

          if (!error && data) {
            setAnswers(prev =>
              prev.map(answer => {
                const countRow = data.find(row => row.answer_id === answer.id)
                return countRow
                  ? { ...answer, reveal_request_count: countRow.request_count }
                  : answer
              })
            )
          }
        }

        refreshRevealRequestCounts()
      }
    )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, answers])

  const handleRevealIdentity = async (answerId: string) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('answers')
      .update({ reveal_status: true, revealed_at: now })
      .eq('id', answerId)

    if (!error) {
      const { data: profile } = await supabase.auth.getUser()
      const authorName = profile?.user?.email || 'Author'
      setAnswers(prev =>
        prev.map(answer =>
          answer.id === answerId
            ? { ...answer, reveal_status: true, revealed_at: now, author_name: authorName }
            : answer
        )
      )
    } else {
      console.error('Failed to reveal identity:', error.message)
    }
  }

  const topVotedAnswerId = answers.reduce((topId, curr) => {
    const top = answers.find((a) => a.id === topId)
    return (curr.votes_count > (top?.votes_count ?? 0)) ? curr.id : topId
  }, answers[0]?.id ?? '')

  return (
    <div className="space-y-8">
      {answers.length === 0 && <p className="text-gray-500">No answers yet.</p>}
      {answers.map((answer) => {
        const isAuthor = answer.user_id === currentUserId
        return (
          <div
            key={answer.id}
            id={`answer-${answer.id}`}
            className="bg-white rounded-lg shadow-md p-6 space-y-3 hover:shadow-lg transition-shadow"
          >
            <p className="text-gray-800">{answer.content}</p>
            <div className="mt-2 text-sm text-gray-500 flex items-center gap-4">
              <span>{formatRelativeOrExactTime(answer.created_at)}</span>
              <UpvoteButton
                answerId={answer.id}
                initialCount={answer.votes_count}
                voted={answer.voted}
              />
            </div>
            <p className="text-sm text-gray-500 italic">
              {answer.reveal_status ? (
                <>
                  By {answer.author_name ?? 'Author'}
                  {answer.revealed_at && (
                    <> • revealed {formatRelativeOrExactTime(answer.revealed_at)}</>
                  )}
                </>
              ) : (
                'By Anonymous'
              )}
            </p>
            {isAuthor && !answer.reveal_status && (
              <button
                onClick={() => handleRevealIdentity(answer.id)}
                className="text-blue-600 underline text-sm"
              >
                Reveal My Identity
                {answer.reveal_request_count !== undefined && answer.reveal_request_count > 0 && (
                  <> ({answer.reveal_request_count} request{answer.reveal_request_count > 1 ? 's' : ''})</>
                )}
              </button>
            )}
            {answer.id === topVotedAnswerId && !answer.reveal_status && !isAuthor && (
              <RequestRevealButton
                answerId={answer.id}
                currentUserId={currentUserId}
                authorId={answer.user_id}
                revealStatus={answer.reveal_status}
                alreadyRequested={answer.reveal_requested ?? false}
                totalRequests={answer.reveal_request_count ?? 0}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}