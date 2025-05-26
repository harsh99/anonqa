import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnswerForm from '@/components/AnswerForm'
import AnswerList from '@/components/AnswerList'

interface Props {
  params: {
    id: string
  }
}

export default async function QuestionPage({ params }: Props) {
  const questionId = params?.id
  const supabase = createClient()

  // ✅ Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login') // 🔐 Require login
  }

  // ✅ Fetch question + answers
  const { data: question, error } = await supabase
    .from('questions')
    .select(`
      id,
      content,
      created_at,
      answers (
        id,
        content,
        created_at,
        votes(count),
        user_votes: votes (
          id,
          user_id,
          ip_address
        )
      )
    `)
    .eq('id', questionId)
    .single()

  if (error || !question) {
    console.error('Error loading question:', error)
    return (
      <div className="p-4 text-red-600">
        Question not found or error loading.
      </div>
    )
  }

  const votedAnswerIds = (question.answers || [])
    .filter(answer => answer.user_votes?.length > 0)
    .map(answer => answer.id)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Question</h1>
      <p className="text-gray-700 mb-6">{question.content}</p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Answers</h2>
        <AnswerList
          answers={question.answers || []}
          votedAnswerIds={votedAnswerIds}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Your Answer</h2>
        <AnswerForm questionId={question.id} />
      </section>
    </div>
  )
}