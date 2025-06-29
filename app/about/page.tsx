export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">DoubtMatter.ai</h1>
      <h2 className="text-1xl font-medium mb-4 italic">"Engage anonymously. Reveal optionally".</h2>
      <p className="text-lg mb-4">
        This anonymous Q&A platform lets users ask and answer questions without revealing their identity.
        Only when an answer becomes top-voted, others can request the author to reveal their identity.
        The author can choose to stay anonymous or reveal themselves — empowering honest, open conversations.
      </p>
      <p className="text-gray-600 text-sm">
        Built using Next.js, Supabase, and Tailwind CSS.
      </p>
      <br></br>
      <p className="text-gray-600 text-sm">
        Built by Harsh, with a lot of Gen AI support.
      </p>
    </div>
  )
}
