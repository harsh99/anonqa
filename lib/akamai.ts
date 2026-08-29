// lib/akamai.ts
//
// Helpers for surfacing what Akamai puts on the request at the origin.
// Account Protector enriches requests with `Akamai-User-Risk` (+ HMAC), and
// Bot Manager adds its own headers. Rather than hardcode names that vary by
// contract and configuration, we echo back everything Akamai-ish so the
// /logmein test page shows whatever is actually arriving.

const AKAMAI_PREFIXES = ['akamai-', 'x-akamai-', 'ak-']

// Non-prefixed headers that Akamai commonly sets and that are useful when
// debugging why a login was scored the way it was.
const AKAMAI_EXTRAS = new Set([
  'true-client-ip',
  'x-forwarded-for',
  'x-acc-user-risk',
  'cf-connecting-ip',
])

export type HeaderPair = { name: string; value: string }

// Structural type so this accepts both a real `Headers` (route handlers) and
// the `ReadonlyHeaders` returned by next/headers (server components).
type IterableHeaders = {
  forEach(cb: (value: string, name: string) => void): void
}

export function collectAkamaiHeaders(headers: IterableHeaders): HeaderPair[] {
  const found: HeaderPair[] = []

  headers.forEach((value, name) => {
    const key = name.toLowerCase()
    if (AKAMAI_PREFIXES.some((p) => key.startsWith(p)) || AKAMAI_EXTRAS.has(key)) {
      found.push({ name: key, value })
    }
  })

  return found.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * `Akamai-User-Risk` arrives as a flat `key=value;key=value` string, e.g.
 *   score=68;risk=udfp:1abcd/ucrs:1/uip:2;trust=ugp:t;general=aci:1;allow=0;action=monitor
 * Split it so the test page can render it as a table instead of one long line.
 */
export function parseUserRisk(raw: string | null): HeaderPair[] | null {
  if (!raw) return null

  const parts = raw
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf('=')
      return eq === -1
        ? { name: part, value: '' }
        : { name: part.slice(0, eq), value: part.slice(eq + 1) }
    })

  return parts.length > 0 ? parts : null
}
