// app/api/upload/route.ts
//
// File-upload sink for testing Akamai Malware Protection.
//
// Malware Protection scans multipart uploads at the EDGE, before they reach the
// origin. So this endpoint's only job is to accept the POST and report what it
// received — it never writes anything to disk.
//
// Reading the result:
//   - You get this JSON back  -> the file was NOT blocked (reached origin)
//   - You get an Akamai deny page instead -> Malware Protection blocked it
//
//   POST /api/upload   (multipart/form-data, field name "file")

import { NextRequest, NextResponse } from 'next/server'
import { collectAkamaiHeaders } from '@/lib/akamai'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const akamai = Object.fromEntries(
    collectAkamaiHeaders(req.headers).map((h) => [h.name, h.value])
  )

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json(
      { received: false, error: 'Body was not multipart/form-data' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // Metadata only — the file is never read into a buffer or written anywhere.
  const files = form
    .getAll('file')
    .filter((v): v is File => v instanceof File)
    .map((f) => ({ filename: f.name, size: f.size, type: f.type || null }))

  return NextResponse.json(
    {
      received: true,
      note: 'Reached origin — not blocked by Malware Protection.',
      files,
      akamai,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
