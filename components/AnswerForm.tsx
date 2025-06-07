'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnswerForm({ questionId }: { questionId: string }) {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')

    const res = await fetch('/api/answers', {
      method: 'POST',
      body: JSON.stringify({ questionId, content }),
    })

    if (res.ok) {
      setContent('')
      setStatus('success')
    } else {
      alert('Failed to submit answer')
      setStatus('idle') // Only reset if it fails
    }

  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        className="w-full border rounded p-2"
        rows={4}
        placeholder="Type your answer here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit Answer'}
      </button>

      {status === 'success' && (
        <div className="flex items-center justify-between bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg shadow-md">
          <span className="flex items-center gap-2">
            ✅ <span>Answer submitted!</span>
          </span>
          <button
            type="button"
            onClick={() => location.reload()}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-200 hover:underline"
          >
            Check out your answer
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

    </form>
  )
}