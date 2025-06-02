'use client'

import { useState } from 'react'
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
}

interface Props {
  answers: Answer[]
  votedAnswerIds?: string[]
  currentUserId: string
}

// ✅ Reusable time formatter for any UTC string
function formatRelativeOrExactTime(utcString: string): string {
  const utcDate = new Date(utcString + 'Z') // ensure UTC
  const now = new Date()
  const diffMs = now.getTime() - utcDate.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return `${diffSec} seconds ago`
  if (diffMin < 60) return `${diffMin} minutes ago`
  if (diffHr < 24) return `${diffHr} hours ago`
  return utcDate.toLocaleString() // show exact time in local timezone
}

export default function AnswerList({ answers: initialAnswers, votedAnswerIds = [], currentUserId }: Props) {
  const [answers, setAnswers] = useState(initialAnswers)
  const supabase = createClientComponentClient()

  const handleRevealIdentity = async (answerId: string) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('answers')
      .update({
        reveal_status: true,
        revealed_at: now,
      })
      .eq('id', answerId)

    if (!error) {
      setAnswers(prev =>
        prev.map(answer =>
          answer.id === answerId
            ? { ...answer, reveal_status: true, revealed_at: now }
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
      {answers.length === 0 && (
        <p className="text-gray-500">No answers yet.</p>
      )}
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

            {/* Author name logic with reveal time */}
            <p className="text-sm text-gray-500 italic">
              {answer.reveal_status ? (
                <>
                  By {answer.author_name ?? 'Author'}
                  {answer.revealed_at && (
                    <> &bull; revealed {formatRelativeOrExactTime(answer.revealed_at)}</>
                  )}
                </>
              ) : (
                'By Anonymous'
              )}
            </p>

            {/* Reveal identity button */}
            {isAuthor && !answer.reveal_status && (
              <button
                onClick={() => handleRevealIdentity(answer.id)}
                className="text-blue-600 underline text-sm"
              >
                Reveal My Identity
              </button>
            )}

            {/* Request reveal button for top-voted anonymous answers */}
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