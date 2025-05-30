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

  const currentUserId = session.user.id

  // ✅ Fetch question + answers with author + reveal info
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
        user_id,
        reveal_status,
        votes(count),
        user_votes: votes (
          id,
          user_id,
          ip_address
        ),
        reveal_requests(count)
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

  // ✅ Fetch reveal requests made by current user for this question's answers
  const answerIds = question.answers?.map((a) => a.id) || []
  let requestedAnswerIds: string[] = []

  if (answerIds.length > 0) {
    const { data: revealRequests, error: revealError } = await supabase
      .from('reveal_requests')
      .select('answer_id')
      .in('answer_id', answerIds)
      .eq('requested_by', currentUserId)

    if (!revealError && revealRequests) {
      requestedAnswerIds = revealRequests.map((r) => r.answer_id)
    }
  }

  // ✅ Enrich answers
  const enrichedAnswers = (question.answers || []).map((answer) => {
    const voted = answer.user_votes?.some(
      (vote) => vote.user_id === currentUserId
    )
    const reveal_requested = requestedAnswerIds.includes(answer.id)
    return {
      ...answer,
      votes_count: answer.votes?.[0]?.count || 0,
      voted,
      reveal_requested,
      reveal_requests_count: answer.reveal_requests?.[0]?.count || 0,
    }
  })

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Question</h1>
      <p className="text-gray-700 mb-6">{question.content}</p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Answers</h2>
        <AnswerList
          answers={enrichedAnswers}
          currentUserId={currentUserId} // ✅ Required for reveal button
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Your Answer</h2>
        <AnswerForm questionId={question.id} />
      </section>
    </div>
  )
}