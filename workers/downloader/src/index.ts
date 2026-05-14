export interface Env {
  WORKER_SECRET: string
  MOCK_MODE: string
  RAPIDAPI_KEY: string
}

const RAPIDAPI_HOST = 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com'
const RAPIDAPI_URL = `https://${RAPIDAPI_HOST}/convert`

function isValidInstagramUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      (parsed.hostname === 'www.instagram.com' ||
        parsed.hostname === 'instagram.com') &&
      /\/(reel|p|tv)\/[A-Za-z0-9_-]+/.test(parsed.pathname)
    )
  } catch {
    return false
  }
}

function getReelId(url: string): string {
  return url.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/)?.[2] ?? 'reel'
}

interface MediaItem {
  type: string
  quality?: string
  url: string
  thumbnail?: string
}

interface ApiResponse {
  media?: MediaItem[]
}

async function callRapidAPI(
  instagramUrl: string,
  apiKey: string
): Promise<{ downloadUrl: string; filename: string; quality: string } | null> {
  try {
    const response = await fetch(
      `${RAPIDAPI_URL}?url=${encodeURIComponent(instagramUrl)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error(`RapidAPI HTTP ${response.status}: ${errText}`)
      return null
    }

    const data: ApiResponse = await response.json()


    if (!data.media || !Array.isArray(data.media) || data.media.length === 0) {
      console.error('No media array in response')
      return null
    }

    // Filter for video items first (reels are videos)
    const videoItems = data.media.filter(m => m.type === 'video')

    // Fall back to any item if no video found
    const candidates = videoItems.length > 0 ? videoItems : data.media

    // Pick best quality
    const best = candidates.sort((a, b) => {
      const qa = parseInt(a.quality ?? '0')
      const qb = parseInt(b.quality ?? '0')
      return qb - qa
    })[0]

    if (!best?.url) {
      console.error('No URL found in best media item')
      return null
    }

    const reelId = getReelId(instagramUrl)
    const ext = best.type === 'image' ? 'jpg' : 'mp4'

    return {
      downloadUrl: best.url,
      filename: `reel_${reelId}.${ext}`,
      quality: best.quality ?? 'HD',
    }
  } catch (err) {
    console.error('RapidAPI error:', err)
    return null
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Worker-Secret',
    }

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })

    if (request.method === 'GET') {
      const path = new URL(request.url).pathname
      if (path === '/health')
        return Response.json({ status: 'ok', mock: env.MOCK_MODE === 'true' }, { headers: cors })
      return Response.json({ error: 'Not found' }, { status: 404, headers: cors })
    }

    if (request.method !== 'POST')
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors })

    // Auth
    const secret = request.headers.get('X-Worker-Secret')
    if (!secret || secret !== env.WORKER_SECRET)
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors })

    // Parse body
    let body: { url?: string }
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors })
    }

    if (!body.url || typeof body.url !== 'string')
      return Response.json({ error: 'Missing field: url' }, { status: 400, headers: cors })

    if (!isValidInstagramUrl(body.url))
      return Response.json(
        { error: 'Must be an Instagram reel URL (instagram.com/reel/...)' },
        { status: 400, headers: cors }
      )

    // Mock mode
    if (env.MOCK_MODE === 'true') {
      return Response.json(
        {
          downloadUrl: 'https://example.com/mock-video.mp4',
          filename: `reel_${getReelId(body.url)}.mp4`,
          quality: '720p',
          mock: true,
        },
        { headers: cors }
      )
    }

    if (!env.RAPIDAPI_KEY)
      return Response.json(
        { error: 'Missing RAPIDAPI_KEY', code: 'CONFIG_ERROR' },
        { status: 500, headers: cors }
      )

    const result = await callRapidAPI(body.url, env.RAPIDAPI_KEY)

    if (!result)
      return Response.json(
        {
          error: 'Could not extract video. Reel may be private, deleted, or this post contains only images.',
          code: 'EXTRACTION_FAILED',
        },
        { status: 500, headers: cors }
      )

    return Response.json(result, { headers: cors })
  },
}