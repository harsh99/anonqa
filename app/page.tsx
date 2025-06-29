import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) console.error('❌ Session error:', sessionError)

  const { data: questions, error } = await supabase
    .from('questions_with_top_answer')
    .select('*')
    .order('question_created_at', { ascending: false })

  if (error) {
    console.error('❌ Error loading questions:', error)
    return <p className="p-4 text-red-600">Failed to load questions.</p>
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      {/* Hero / Intro */}
      {!session && (
        <section className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Welcome to <span className="text-orange-600">Doubtmatter.ai</span></h1>
          <p className="text-gray-700 mb-4 text-base">
            <ul>
              Ask questions anonymously. Get answers.
            </ul>
            <ul>
              Request reveals if you want to know who's behind the best ones.
            </ul>
            <ul>
              Feature on leaderboards.
            </ul>
          </p>
          <Link href="/signup">
            <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded shadow">
              Get Started
            </button>
          </Link>
        </section>
      )}

      {/* Trending Section with CTA Cards */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition p-6 text-center">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Curious?</h3>
            <p className="text-gray-600 mb-4 text-sm">Log in to explore more answers and ask your own questions.</p>
            <Link href="/login">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">
                Log in
              </button>
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition p-6 text-center">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Take a glimpse</h3>
            <p className="text-gray-600 mb-4 text-sm">Browse public questions and top answers without logging in.</p>
            <Link href="/questions">
              <button className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-2 rounded">
                Explore
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}