// app/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  console.log('🪵 Server-side Supabase session:', session)
  if (sessionError) console.error('❌ Session error:', sessionError)

  const { data: questions, error } = await supabase
    .from('questions_with_top_answer')
    .select('*')

  if (error) {
    console.error('❌ Error loading questions:', error)
    return <p className="p-4 text-red-600">Failed to load questions.</p>
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Top Questions</h1>
      {questions.map((q) => (
        <div key={q.question_id} className="mb-6 border-b pb-4">
          <h2 className="text-xl font-semibold">{q.question_content}</h2>
          <p className="text-gray-700 mt-2">
            {q.top_answer_content || 'No answers yet.'}
          </p>

          {session ? (
            <Link href={`/questions/${q.question_id}`}>
              <button className="mt-2 text-blue-600 hover:underline">
                Read more
              </button>
            </Link>
          ) : (
            <Link href="/login">
              <button className="mt-2 text-blue-600 hover:underline">
                Sign in to read more
              </button>
            </Link>
          )}
        </div>
      ))}
    </main>
  )
}