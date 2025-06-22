import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnswerForm from '@/components/AnswerForm'
import AnswerList from '@/components/AnswerList'

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
  if (diffHr == 1) return `${diffHr} hour ago`
  if (diffHr < 24) return `${diffHr} hours ago`
  return utcDate.toLocaleString()
}

function formatAnswerCount(count: number) {
  if (count === 1) return '1 answer'
  if (count > 100) return '100+ answers'
  return `${count} answers`
}

interface Props {
  params: {
    id: string
  }
}

export default async function QuestionPage({ params }: Props) {
  const questionId = params?.id
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const currentUserId = session.user.id

  // Fetch question + answers, including author name with alias 'user'
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
        revealed_at,
        votes(count),
        user_votes: votes (
          user_id
        ),
        user:users (
          username
        )
      )
    `)
    .eq('id', questionId)
    .single()

  if (error || !question) {
    console.error('Error loading question:', error)
    return <div className="p-4 text-red-600">Question not found or error loading.</div>
  }

  // Log answers for debugging user data
  console.log('Fetched answers with user data:', question.answers)

  // Find top-voted answer
  const answers = question.answers || []
  const topAnswer = answers
    .map((a) => ({
      ...a,
      votes_count: a.votes?.[0]?.count || 0,
    }))
    .sort((a, b) => b.votes_count - a.votes_count)[0]

  let reveal_requested = false
  let reveal_request_count = 0
  
  //Counting total no of answers
  const totalAnswers = question.answers?.length || 0

  if (topAnswer) {
    const { data: countsData, error: countsError } = await supabase
      .from('reveal_request_counts_view')
      .select('answer_id, request_count')
      .eq('answer_id', topAnswer.id)

    console.log('Reveal request counts from view:', countsData, 'Error:', countsError)

    if (countsError) {
      console.error('View query error:', countsError.message)
    } else if (countsData && countsData.length > 0) {
      reveal_request_count = Number(countsData[0].request_count)
    }

    const { data: userRequests, error: userReqError } = await supabase
      .from('reveal_requests')
      .select('id')
      .eq('requested_by', currentUserId)
      .eq('answer_id', topAnswer.id)
      .maybeSingle()

    reveal_requested = !!userRequests
  }

  // Enrich answers with reveal data and author name using `user` alias

  type AnswerWithUser = typeof answers[number] & {
    user?: { username: string } | null
  }

  const enrichedAnswers = (answers as AnswerWithUser[]).map((answer) => {
    const voted = answer.user_votes?.some((v) => v.user_id === currentUserId)
    const isTop = topAnswer && answer.id === topAnswer.id
    return {
      ...answer,
      votes_count: answer.votes?.[0]?.count || 0,
      voted,
      reveal_requested: isTop ? reveal_requested : false,
      reveal_request_count: isTop ? reveal_request_count : 0,
      author_name: answer.user?.username ?? null, // changed to `user`
    }
  })

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">Question</h2>
      <p className="text-lg font-medium mb-4">
        {question.content}
          <span className="ml-2 text-xs text-gray-500 italic ">
             • {formatRelativeOrExactTime(question.created_at)}
          </span>
      </p>

      <section className="mb-10">
        <div className="flex items-baseline mb-4">
          <h2 className="text-xl font-semibold">Answers</h2>
          <span className="ml-2 text-sm text-gray-600">
            {formatAnswerCount(totalAnswers)}
          </span>
        </div>
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