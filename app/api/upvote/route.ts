import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// ✅ Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Add upvote
export async function POST(req: NextRequest) {
  try {
    const { answerId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'anonymous';

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    console.log('🔍 Insert vote for user_id:', user?.id);
    const { error } = await supabaseAdmin.from('votes').insert({
      answer_id: answerId,
      user_id: user?.id ?? null,
      ip_address: user ? null : ip,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE: Remove upvote
export async function DELETE(req: NextRequest) {
  try {
    const { answerId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'anonymous';

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const deleteQuery = supabaseAdmin
      .from('votes')
      .delete()
      .eq('answer_id', answerId);

    if (user) {
      deleteQuery.eq('user_id', user.id);
    } else {
      deleteQuery.eq('ip_address', ip);
    }

    const { error } = await deleteQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}