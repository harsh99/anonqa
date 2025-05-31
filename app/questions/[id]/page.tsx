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

  // ✅ Check user session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const currentUserId = session.user.id

  // ✅ Fetch question + answers with vote counts
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
          user_id
        )
      )
    `)
    .eq('id', questionId)
    .single()

  if (error || !question) {
    console.error('Error loading question:', error)
    return <div className="p-4 text-red-600">Question not found or error loading.</div>
  }

  // ✅ Find top-voted answer
  const answers = question.answers || []
  const topAnswer = answers
    .map((a) => ({
      ...a,
      votes_count: a.votes?.[0]?.count || 0,
    }))
    .sort((a, b) => b.votes_count - a.votes_count)[0]

  let reveal_requested = false
  let reveal_request_count = 0

  if (topAnswer) {
  const { data: countsData, error: countsError } = await supabase
    .from('reveal_request_counts_view')
    .select('answer_id, request_count')
    .eq('answer_id', topAnswer.id);

  console.log('Reveal request counts from view:', countsData, 'Error:', countsError);
 
    
  if (countsError) {
    console.error('View query error:', countsError.message);
  } else if (countsData && countsData.length > 0) {
    reveal_request_count = Number(countsData[0].request_count);
  }

  // Check if current user requested reveal for this answer (unchanged)
  const { data: userRequests, error: userReqError } = await supabase
    .from('reveal_requests')
    .select('id')
    .eq('requested_by', currentUserId)
    .eq('answer_id', topAnswer.id)
    .maybeSingle();

  reveal_requested = !!userRequests;
}


  // ✅ Enrich answers with reveal info only for top one
  const enrichedAnswers = answers.map((answer) => {
    const voted = answer.user_votes?.some((v) => v.user_id === currentUserId)
    const isTop = topAnswer && answer.id === topAnswer.id

    return {
      ...answer,
      votes_count: answer.votes?.[0]?.count || 0,
      voted,
      reveal_requested: isTop ? reveal_requested : false,
      reveal_request_count: isTop ? reveal_request_count : 0,
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
          currentUserId={currentUserId}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Your Answer</h2>
        <AnswerForm questionId={question.id} />
      </section>
    </div>
  )
}