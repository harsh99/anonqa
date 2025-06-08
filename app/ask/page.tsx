'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AskPage() {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setStatus('❌ Error: ' + error)
      setSuccess(false)
    } else {
      setSuccess(true)
      setStatus('')
      setContent('')
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Ask a Question</h1>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          className="w-full border rounded p-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's your question?"
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>

      {status && <p className="mt-2 text-sm text-red-500">{status}</p>}

      {success && (
        <div className="mt-14 flex items-center justify-between bg-gray-900 border border-gray-700 text-white px-4 py-1 rounded-lg shadow-md">
          <span className="flex items-center gap-2">
            ✅ <span>Question submitted!</span>
          </span>
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-200 hover:underline"
          >
            View on home page
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}