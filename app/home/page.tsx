// app/home/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

function truncate(str: string, max: number) {
  return str.length <= max ? str : str.slice(0, max) + '…'
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

export default function HomeFeed() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('questions_with_top_answer')
        .select('*')
        .order('question_created_at', { ascending: false })

      if (error) {
        console.error('❌ Error loading questions:', error.message)
      } else {
        setQuestions(data)
      }
      setLoading(false)
    }

    fetchData()
  }, [supabase, router])

  if (loading) {
    return <p className="p-4 text-gray-500">Loading...</p>
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">💡 My Feed 💡</h1>
      {questions.length === 0 ? (
        <p className="text-gray-500">No questions yet.</p>
      ) : (
        <ul className="space-y-4">
          {questions.map((q) => (
            <li key={q.question_id}>
              <Link href={`/questions/${q.question_id}`}>
                <div className="p-4 border rounded-xl shadow bg-rose-50 hover:bg-teal-100 transition cursor-pointer">
                  <h2 className="text-lg font-medium">{q.question_content}</h2>

                  {q.top_answer_content ? (
                    <div className="text-sm text-gray-700 mt-2 italic">
                      “{truncate(q.top_answer_content, 100)}”
                      {q.answer_created_at && (
                        <span className="ml-2 text-xs text-gray-500">
                          • {formatRelativeOrExactTime(q.answer_created_at)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 italic text-sm inline-block max-w-xs">
                        🚫 No answers yet. Be the first one to answer!
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mt-1">
                    {q.answer_count ?? 0} answer{q.answer_count === 1 ? '' : 's'}
                  </p>

                  <button className="mt-2 text-blue-600 hover:underline">
                    Read more
                  </button>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}