import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json(
      {
        error: 'Unauthorized. Log in or sign up if you are a new user.',
        message: 'You must be logged in to perform this action. Please log in or sign up to continue.',
        code: 401,
      },
      { status: 401 }
    )

  }

  const { content } = await req.json()

  if (!content || content.trim() === '') {
    return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 })
  }

  const { error, data } = await supabase.from('questions').insert([
    {
      content,
      user_id: session.user.id,
    },
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Question submitted successfully', data })
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('questions')
    .select('id, content, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}