'use client'

import UpvoteButton from './UpvoteButton'

interface Answer {
  id: string
  content: string
  created_at: string
  votes?: { count: number }[]
}

interface Props {
  answers: Answer[]
  votedAnswerIds?: string[]
}

export default function AnswerList({ answers, votedAnswerIds = [] }: Props) {
  return (
    <div className="space-y-6">
      {answers.length === 0 && (
        <p className="text-gray-500">No answers yet.</p>
      )}
      {answers.map((answer) => (
        <div key={answer.id} className="border rounded p-4">
          <p className="text-gray-800">{answer.content}</p>
          <div className="mt-2 text-sm text-gray-500 flex items-center gap-4">
            <span>{new Date(answer.created_at).toLocaleString()}</span>
            <UpvoteButton
              answerId={answer.id}
              initialCount={answer.votes?.[0]?.count || 0}
              voted={votedAnswerIds.includes(answer.id)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}