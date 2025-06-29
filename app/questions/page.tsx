'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function QuestionsPage() {
  const session = useSession()
  const router = useRouter()

  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      console.log('🔁 Redirecting logged-in user from /questions to /home')
      router.replace('/home')
      return
    }

    const fetchData = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          answers:answers (
            content,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching questions:', error)
      } else {
        const questionsWithLatest = (data || []).map((q: any) => ({
          ...q,
          latestAnswer: q.answers?.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0],
          answerCount: q.answers?.length || 0,
        }))

        setQuestions(questionsWithLatest)
      }

      setLoading(false)
    }

    fetchData()
  }, [session, router])

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Questions</h1>
      {questions.length === 0 ? (
        <p className="text-gray-500">No questions yet.</p>
      ) : (
        <ul className="space-y-4">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/questions/${q.id}`}>
                <div className="p-4 border rounded-xl shadow hover:bg-gray-50 transition cursor-pointer">
                  <p className="text-lg font-medium">{q.content}</p>

                  {q.latestAnswer && (
                    <div className="text-sm text-gray-700 mt-2 italic">
                      “{q.latestAnswer.content}”
                      <span className="ml-2 text-xs text-gray-500">
                        • {dayjs(q.latestAnswer.created_at).fromNow()}
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mt-1">
                    {q.answerCount} answer{q.answerCount === 1 ? '' : 's'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Utility function to truncate long answers
function truncate(str: string, max: number) {
  return str.length <= max ? str : str.slice(0, max) + '…'
}