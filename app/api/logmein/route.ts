// app/api/logmein/route.ts
//
// Login endpoint built for testing Akamai Account Protector against this origin.
//
// Contract (deliberately boring, so Account Protector can be configured against it):
//   POST /api/logmein
//   Body: application/x-www-form-urlencoded OR application/json
//   Fields: `username` (`email` also accepted) + `password`
//   Responses:
//     200 + X-Login-Result: success   — credentials accepted
//     401 + X-Login-Result: failure   — credentials rejected
//     400 + X-Login-Result: invalid   — missing username or password
//
// Credentials are checked against fixed test rules, NOT against Supabase or any
// real account store — see TEST_PASSWORD / MAX_USERNAME_LENGTH below. Nothing
// here can authenticate a real user or establish a session.
//
// Send `Accept: application/json` to get JSON back instead of HTML (for curl
// and load-generation tooling). Browsers posting the /logmein form get HTML.

import { NextRequest, NextResponse } from 'next/server'
import { collectAkamaiHeaders, parseUserRisk, type HeaderPair } from '@/lib/akamai'

type LoginResult = 'success' | 'failure' | 'invalid'

// The whole validation rule: any username shorter than 20 characters, paired
// with this password, is treated as a successful login. Everything else is a
// 401, which is what lets you drive deterministic failure traffic at Account
// Protector without needing real accounts or tripping Supabase rate limits.
const TEST_PASSWORD = 'testpwd'
const MAX_USERNAME_LENGTH = 20

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  )
}

async function readCredentials(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}) as Record<string, unknown>)
    return {
      username: String(body.username ?? body.email ?? '').trim(),
      password: String(body.password ?? ''),
    }
  }

  const form = await req.formData().catch(() => new FormData())
  return {
    username: (form.get('username') ?? form.get('email') ?? '').toString().trim(),
    password: (form.get('password') ?? '').toString(),
  }
}

function renderHeaderRows(pairs: HeaderPair[]): string {
  if (pairs.length === 0) {
    return `<tr><td colspan="2" class="none">None present — request did not come through Akamai, or Account Protector is not enriching this path yet.</td></tr>`
  }

  return pairs
    .map(
      ({ name, value }) => `
        <tr>
          <td class="k">${escapeHtml(name)}</td>
          <td class="v">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('')
}

// Styles are inlined rather than pulled from a CDN: this page is served from a
// live, Akamai-fronted domain, and an external script tag would be one more
// thing to whitelist in CSP for no benefit.
const STYLES = `
  body { margin:0; background:#f3f4f6; color:#1f2937;
         font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height:1.5; }
  .wrap { max-width:42rem; margin:0 auto; padding:1.5rem; }
  .card { background:#fff; border:1px solid #e5e7eb; border-radius:.5rem; padding:1.5rem; margin-bottom:1.5rem; }
  .ok   { background:#f0fdf4; border-color:#86efac; }
  .bad  { background:#fef2f2; border-color:#fca5a5; }
  h1 { margin:0; font-size:1.5rem; }
  h2 { margin:0 0 .25rem; font-size:1.125rem; }
  .ok h1 { color:#14532d; } .ok p { color:#166534; }
  .bad h1 { color:#7f1d1d; } .bad p { color:#991b1b; }
  .hint { margin:0 0 .75rem; font-size:.75rem; color:#6b7280; }
  table { width:100%; border-collapse:collapse; text-align:left; }
  td { padding:.25rem 0; border-bottom:1px solid #f3f4f6; vertical-align:top;
       font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.75rem; }
  td.k { padding-right:1rem; white-space:nowrap; color:#4b5563; }
  td.v { color:#111827; word-break:break-all; }
  td.none { color:#6b7280; font-style:italic; }
  a { color:#2563eb; font-size:.875rem; }
`

function renderPage(opts: {
  result: LoginResult
  username: string
  detail: string
  akamai: HeaderPair[]
  userRisk: HeaderPair[] | null
}): string {
  const { result, username, detail, akamai, userRisk } = opts

  const banner =
    result === 'success'
      ? `<div class="card ok">
           <h1>You are in ${escapeHtml(username)}</h1>
           <p>${escapeHtml(detail)}</p>
         </div>`
      : `<div class="card bad">
           <h1>Login failed</h1>
           <p>${escapeHtml(detail)}</p>
         </div>`

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>logmein — ${escapeHtml(result)}</title>
    <style>${STYLES}</style>
  </head>
  <body>
    <div class="wrap">
      ${banner}

      <div class="card">
        <h2>Akamai request headers</h2>
        <p class="hint">What this origin received for the POST.</p>
        <table><tbody>${renderHeaderRows(akamai)}</tbody></table>
      </div>

      ${
        userRisk
          ? `<div class="card">
               <h2>Akamai-User-Risk (parsed)</h2>
               <p class="hint">Account Protector's per-request assessment.</p>
               <table><tbody>${renderHeaderRows(userRisk)}</tbody></table>
             </div>`
          : ''
      }

      <a href="/logmein">Back to the login form</a>
    </div>
  </body>
</html>`
}

function respond(
  req: NextRequest,
  opts: { result: LoginResult; status: number; username: string; detail: string }
) {
  const { result, status, username, detail } = opts

  const akamai = collectAkamaiHeaders(req.headers)
  const userRisk = parseUserRisk(req.headers.get('akamai-user-risk'))

  // Account Protector's success/failure detection can key on either the status
  // code or this header, whichever is easier to configure on your property.
  const headers: Record<string, string> = {
    'X-Login-Result': result,
    'Cache-Control': 'no-store',
  }

  const wantsJson = (req.headers.get('accept') ?? '').includes('application/json')

  if (wantsJson) {
    return NextResponse.json(
      {
        result,
        message: result === 'success' ? `You are in ${username}` : detail,
        username: username || null,
        akamai: Object.fromEntries(akamai.map((h) => [h.name, h.value])),
        akamai_user_risk: userRisk
          ? Object.fromEntries(userRisk.map((h) => [h.name, h.value]))
          : null,
      },
      { status, headers }
    )
  }

  return new NextResponse(renderPage({ result, username, detail, akamai, userRisk }), {
    status,
    headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function POST(req: NextRequest) {
  const { username, password } = await readCredentials(req)

  if (!username || !password) {
    return respond(req, {
      result: 'invalid',
      status: 400,
      username,
      detail: 'Both username and password are required.',
    })
  }

  // Spelled out rather than collapsed into one boolean so an unexpected 401
  // during a test run tells you which rule it tripped.
  if (username.length >= MAX_USERNAME_LENGTH) {
    return respond(req, {
      result: 'failure',
      status: 401,
      username,
      detail: `Invalid credentials — username must be shorter than ${MAX_USERNAME_LENGTH} characters.`,
    })
  }

  if (password !== TEST_PASSWORD) {
    return respond(req, {
      result: 'failure',
      status: 401,
      username,
      detail: 'Invalid credentials — wrong password.',
    })
  }

  return respond(req, {
    result: 'success',
    status: 200,
    username,
    detail: 'Accepted by the test rules — no real account was checked and no session was created.',
  })
}

// A GET here is almost always someone landing on the wrong URL; point them at
// the form rather than 405-ing, which would muddy Account Protector's stats.
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/logmein', req.url))
}
