import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// ✅ Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Add upvote
export async function POST(req: NextRequest) {
  try {
    const { answerId } = await req.json()
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'anonymous'

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('🔍 Insert vote for user_id:', user?.id)

    // ✅ Check if vote already exists
    const existingVoteQuery = supabaseAdmin
      .from('votes')
      .select('id')
      .eq('answer_id', answerId)
      .limit(1)

    if (user) {
      existingVoteQuery.eq('user_id', user.id)
    } else {
      existingVoteQuery.eq('ip_address', ip)
    }

    const { data: existingVotes, error: selectError } = await existingVoteQuery

    if (selectError) {
      console.error('❌ Error checking for existing vote:', selectError.message)
      return NextResponse.json({ error: selectError.message }, { status: 400 })
    }

    if (!existingVotes || existingVotes.length === 0) {
      // ✅ Only insert if no existing vote
      const { error: insertError } = await supabaseAdmin.from('votes').insert({
        answer_id: answerId,
        user_id: user?.id ?? null,
        ip_address: user ? null : ip,
      })

      if (insertError) {
        console.error('❌ Vote insert failed:', insertError.message)
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }

      // ✅ Increment vote count
      const { error: updateError } = await supabaseAdmin.rpc('increment_answer_vote', {
        answer_id_input: answerId,
      })

      if (updateError) {
        console.error('❌ Vote count increment failed:', updateError.message)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ Unexpected POST error:', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// DELETE: Remove upvote
export async function DELETE(req: NextRequest) {
  try {
    const { answerId } = await req.json()
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'anonymous'

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const deleteQuery = supabaseAdmin
      .from('votes')
      .delete()
      .eq('answer_id', answerId)

    if (user) {
      deleteQuery.eq('user_id', user.id)
    } else {
      deleteQuery.eq('ip_address', ip)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('❌ Vote deletion failed:', deleteError.message)
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // ✅ Decrement vote count
    const { error: updateError } = await supabaseAdmin.rpc('decrement_answer_vote', {
      answer_id_input: answerId,
    })

    if (updateError) {
      console.error('❌ Vote count decrement failed:', updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ Unexpected DELETE error:', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}