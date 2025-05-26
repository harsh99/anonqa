'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AskPage() {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data, error } = await supabase.from('questions').insert([
      { content } // assumes your `questions` table has a "content" column
    ])

    if (error) {
      setStatus('❌ Error: ' + error.message)
    } else {
      setStatus('✅ Question submitted!')
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
      <p className="mt-2 text-sm">{status}</p>
    </div>
  )
}