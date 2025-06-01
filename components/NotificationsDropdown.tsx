'use client'

import { useEffect, useRef, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { FaBell } from 'react-icons/fa'

interface Notification {
  id: string
  user_id: string
  answer_id: string | null
  type: string
  created_at: string | null
  read: boolean | null
  answers: {
    id: string
    question_id: string
    questions: {
      id: string
      content: string
    } | null
  } | null
}

export default function NotificationsDropdown() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const userIdRef = useRef<string | null>(null)
  const channelRef = useRef<any>(null)

  const fetchNotifications = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          user_id,
          answer_id,
          type,
          created_at,
          read,
          answers (
            id,
            question_id,
            questions (
              id,
              content
            )
          )
        `)
        .eq('read', false)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (err: any) {
      setError(err.message || 'Error loading notifications')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = (userId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('notifications:realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        async (payload) => {
          const newNotif: Notification = payload.new

          if (newNotif.user_id !== userId || newNotif.read) return

          const { data: enriched, error: enrichError } = await supabase
            .from('notifications')
            .select(`
              id,
              user_id,
              answer_id,
              type,
              created_at,
              read,
              answers (
                id,
                question_id,
                questions (
                  id,
                  content
                )
              )
            `)
            .eq('id', newNotif.id)
            .single()

          if (!enrichError && enriched) {
            setNotifications((prev) => [enriched, ...prev])
          }
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser()

      if (error || !user) {
        setLoading(false)
        return
      }

      userIdRef.current = user.id
      await fetchNotifications(user.id)
      subscribeToNotifications(user.id)
    }

    init()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id
      if (userId) {
        userIdRef.current = userId
        fetchNotifications(userId)
        subscribeToNotifications(userId)
      }
    })

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      authListener.subscription.unsubscribe()
    }
  }, [])

  const unreadCount = notifications.length

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id)

      if (error) throw error

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))

      if (notification.answers?.question_id && notification.answer_id) {
        router.push(
          `/questions/${notification.answers.question_id}#answer-${notification.answer_id}`
        )
      } else {
        router.push('/')
      }

      setDropdownOpen(false)
    } catch (err) {
      console.error('❌ Failed to mark notification as read:', err)
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        aria-label="Notifications"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative text-gray-600 hover:text-gray-900 focus:outline-none ml-4 flex-shrink-0 w-10 h-10 flex items-center justify-center"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <>
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <button
                onClick={() => setDropdownOpen(false)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-64px)] p-4">
              {loading && <div className="text-center text-gray-500">Loading...</div>}
              {error && <div className="text-center text-red-500">{error}</div>}
              {!loading && notifications.length === 0 && (
                <div className="text-center text-gray-500">No new notifications</div>
              )}
              {notifications.map((notif) => {
                const questionTitle = notif.answers?.questions?.content ?? 'your question'
                const message =
                  notif.type === 'reveal_request'
                    ? `Reveal request for your answer to "${questionTitle}". Wanna take action now?`
                    : 'You have a notification.'

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <div className="font-medium">{message}</div>
                    <div className="text-xs text-gray-500">
                      {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Overlay */}
          <div
            onClick={() => setDropdownOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
          />
        </>
      )}
    </div>
  )
}