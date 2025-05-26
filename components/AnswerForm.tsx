'use client'

import { useState } from 'react'

export default function AnswerForm({ questionId }: { questionId: string }) {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

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
    }

    setTimeout(() => setStatus('idle'), 1500)
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
        <p className="text-green-600">Answer submitted!</p>
      )}
    </form>
  )
}