// app/api/answers/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const body = await req.json()
  const { questionId, content } = body

  if (!questionId || !content) {
    return NextResponse.json(
      { error: 'Missing questionId or content' },
      { status: 400 }
    )
  }

  // ✅ Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ Insert with user_id
  const { error } = await supabase.from('answers').insert({
    question_id: questionId,
    content,
    user_id: user.id,
    votes: 0, // optional, based on your schema
  })

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}