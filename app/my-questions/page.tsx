import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnswerList from '@/components/AnswerList'
import Link from 'next/link'

function formatRelativeOrExactTime(utcString: string): string {
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

export default async function MyQuestionsPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const currentUserId = session.user.id

  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id,
      content,
      created_at,
      answers (
        id,
        content,
        created_at,
        user_id,
        votes(count),
        user:users (
          username
        )
      )
    `)
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user questions:', error)
    return <div className="p-4 text-red-600">Error loading your questions.</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Questions</h1>
      {questions.length === 0 && (
        <p className="text-gray-500 italic">You haven’t asked anything yet.</p>
      )}
      {questions.map((q) => (
        <div key={q.id} className="mb-8 border-b border-gray-200 pb-4">
          <Link href={`/questions/${q.id}`}>
            <h2 className="text-lg font-semibold hover:underline">{q.content}</h2>
          </Link>
          <p className="text-xs text-gray-500 italic mt-1">
            • {formatRelativeOrExactTime(q.created_at)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {q.answers.length === 0
              ? 'No answers yet'
              : q.answers.length === 1
              ? '1 answer'
              : `${q.answers.length} answers`}
          </p>
        </div>
      ))}
    </div>
  )
}