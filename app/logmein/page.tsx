// app/logmein/page.tsx
//
// Login form used to exercise Akamai Account Protector against this origin.
// The form itself is plain HTML with no JS of its own — submitting posts
// application/x-www-form-urlencoded straight to /api/logmein, so Account
// Protector can extract `username` from a standard body parameter rather than
// from a Server Action's opaque payload.

import { headers } from 'next/headers'
import { collectAkamaiHeaders, parseUserRisk, type HeaderPair } from '@/lib/akamai'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'logmein',
  robots: { index: false, follow: false },
}

function HeaderTable({ pairs }: { pairs: HeaderPair[] }) {
  if (pairs.length === 0) {
    return (
      <p className="text-sm italic text-gray-500">
        None present — this request did not come through Akamai, or Account Protector is not
        enriching this path yet.
      </p>
    )
  }

  return (
    <table className="w-full text-left">
      <tbody>
        {pairs.map(({ name, value }) => (
          <tr key={name} className="border-b border-gray-100 align-top">
            <td className="whitespace-nowrap py-1 pr-4 font-mono text-xs text-gray-600">{name}</td>
            <td className="break-all py-1 font-mono text-xs text-gray-900">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function LogMeInPage() {
  const requestHeaders = headers()
  const akamai = collectAkamaiHeaders(requestHeaders)
  const userRisk = parseUserRisk(requestHeaders.get('akamai-user-risk'))

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="mb-1 text-2xl font-bold">Log in</h1>
        <p className="mb-4 text-sm text-gray-500">
          Posts <code className="font-mono">username</code> and{' '}
          <code className="font-mono">password</code> to{' '}
          <code className="font-mono">/api/logmein</code>.
        </p>

        <form action="/api/logmein" method="POST" className="space-y-3">
          <input
            type="text"
            name="username"
            placeholder="Username"
            autoComplete="username"
            required
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full rounded border px-3 py-2"
          />
          <button
            type="submit"
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Log in
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold">Akamai request headers</h2>
        <p className="mb-3 text-xs text-gray-500">What this origin received for the page load.</p>
        <HeaderTable pairs={akamai} />
      </div>

      {userRisk && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-lg font-semibold">Akamai-User-Risk (parsed)</h2>
          <p className="mb-3 text-xs text-gray-500">
            Account Protector&apos;s per-request assessment.
          </p>
          <HeaderTable pairs={userRisk} />
        </div>
      )}
    </div>
  )
}
