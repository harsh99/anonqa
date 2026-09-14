// app/api/echo/route.ts
//
// Read-only endpoint that reflects back what Akamai put on the request when it
// reached the origin. Built for demoing Bot Manager Standard: point a client
// with a given user-agent at this path and read the `Akamai-Bot` classification
// Akamai forwarded.
//
//   GET /api/echo  ->  JSON { akamai, akamai_bot, akamai_user_risk }
//
// `Akamai-Bot` only appears once the property is configured to forward it to the
// origin (Property Manager -> Modify Outgoing Request Header). Until then the
// akamai_bot field is null and `akamai` shows whatever else is arriving.

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { collectAkamaiHeaders, parseAkamaiBot, parseUserRisk } from '@/lib/akamai'

export const dynamic = 'force-dynamic'

function toObject(pairs: { name: string; value: string }[] | null) {
  return pairs ? Object.fromEntries(pairs.map((p) => [p.name, p.value])) : null
}

export async function GET() {
  const h = headers()
  const akamai = collectAkamaiHeaders(h)

  return NextResponse.json(
    {
      user_agent: h.get('user-agent'),
      akamai: Object.fromEntries(akamai.map((p) => [p.name, p.value])),
      akamai_bot: toObject(parseAkamaiBot(h.get('akamai-bot'))),
      akamai_user_risk: toObject(parseUserRisk(h.get('akamai-user-risk'))),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
