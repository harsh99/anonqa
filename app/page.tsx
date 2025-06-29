import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HeroSection from '@/components/HeroSection'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) console.error('❌ Session error:', sessionError)
  
  if (session) {
    redirect('/home')
  }

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
      <HeroSection />

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