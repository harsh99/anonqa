import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('custom_leaderboard_query')  // we'll define this below as a custom Postgres function

  if (error) {
    console.error('Leaderboard fetch error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data)
}