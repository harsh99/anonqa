'use client'

import UpvoteButton from './UpvoteButton'
import { RequestRevealButton } from './RequestRevealButton' // new import

interface Answer {
  id: string
  content: string
  created_at: string
  user_id: string
  reveal_status: boolean
  votes_count: number
  voted: boolean
  reveal_requested?: boolean // ✅ added
  reveal_request_count?: number
}

interface Props {
  answers: Answer[]
  votedAnswerIds?: string[]
  currentUserId: string
}

export default function AnswerList({ answers, votedAnswerIds = [], currentUserId }: Props) {
  // Find top-voted answer
  const topVotedAnswerId = answers.reduce((topId, curr) => {
    const top = answers.find((a) => a.id === topId)
    return (curr.votes_count > (top?.votes_count ?? 0)) ? curr.id : topId
  }, answers[0]?.id ?? '')

  return (
    <div className="space-y-8"> {/* increased spacing here */}
      {answers.length === 0 && (
        <p className="text-gray-500">No answers yet.</p>
      )}
      {answers.map((answer) => (
        <div
          key={answer.id}
          id={`answer-${answer.id}`}
          className="bg-white rounded-lg shadow-md p-6 space-y-3 hover:shadow-lg transition-shadow"
        >
          <p className="text-gray-800">{answer.content}</p>
          <div className="mt-2 text-sm text-gray-500 flex items-center gap-4">
            <span>{new Date(answer.created_at).toLocaleString()}</span>
            <UpvoteButton
              answerId={answer.id}
              initialCount={answer.votes_count}
              voted={answer.voted}
            />
          </div>

          {/* Request Reveal Button for top-voted, anonymous answers */}
          {answer.id === topVotedAnswerId && !answer.reveal_status && (
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
      ))}
    </div>
  )
}