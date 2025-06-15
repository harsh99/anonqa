'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface LeaderboardEntry {
  user_id: string
  username: string
  answers_revealed: number
  reveal_requests_received: number
}

function getCurrentMonthName() {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date())
}

function trimUsername(email: string) {
  return email.split('@')[0]
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const month = getCurrentMonthName()
  const supabase = createClientComponentClient()

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error('Failed to fetch leaderboard', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()

    const channel = supabase.channel('leaderboard_updates')

    // Listen to new reveal requests
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reveal_requests' },
        () => fetchLeaderboard()
      )
      // Listen to changes in reveal status
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'answers' },
        (payload) => {
          if (payload.old?.reveal_status !== payload.new?.reveal_status) {
            fetchLeaderboard()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) return <div className="p-4">Loading leaderboard...</div>

  return (
    <div className="p-4 bg-gray-200 rounded-xl shadow border w-72 max-h-[500px]">
      <h2
        className="text-center font-semibold mb-2 cursor-help"
        title="Users with the most number of answers revealed and total number of reveal requests received this month"
      >
        🏆 Leaders of {month} 🏆
      </h2>
      <div className="max-h-[280px] overflow-y-auto pr-2">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="pr-4">Username</th>
              <th className="pr-4 text-center">Revealed</th>
              <th className="text-center">Requests</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user) => (
              <tr key={user.user_id} className="border-b border-gray-100">
                <td className="py-1 pr-4">{trimUsername(user.username)}</td>
                <td className="py-1 pr-4 text-center">{user.answers_revealed}</td>
                <td className="py-1 text-center">{user.reveal_requests_received}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}