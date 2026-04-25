import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (val) =>
        /instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+/.test(val),
      { message: 'Must be a valid Instagram reel URL' }
    ),
})

export async function POST(request: NextRequest) {
  // Parse + validate input
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'BAD_REQUEST' },
      { status: 400 }
    )
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  // Track free tier usage (IP-based, simple)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  // Call Cloudflare Worker
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL
  const workerSecret = process.env.CLOUDFLARE_WORKER_SECRET

  if (!workerUrl || !workerSecret) {
    console.error('Missing CLOUDFLARE_WORKER_URL or CLOUDFLARE_WORKER_SECRET')
    return NextResponse.json(
      { error: 'Server misconfiguration', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }

  try {
    const workerResponse = await fetch(`${workerUrl}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': workerSecret,
        'X-Client-IP': ip,
      },
      body: JSON.stringify({ url: parsed.data.url }),
    })

    const data = await workerResponse.json()

    if (!workerResponse.ok) {
      return NextResponse.json(
        { error: data.error ?? 'Worker error', code: 'WORKER_ERROR' },
        { status: 502 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('Worker call failed:', err)
    return NextResponse.json(
      { error: 'Could not reach download service. Try again.', code: 'WORKER_UNREACHABLE' },
      { status: 502 }
    )
  }
}
