# ReelSave Pro — Cloudflare Worker (Downloader)

Cloudflare Worker for downloading Instagram Reels. Handles URL validation, authentication, and proxies to yt-dlp for actual downloads.

## Tech Stack

- **Runtime**: Cloudflare Workers (V8)
- **Language**: TypeScript (strict mode)
- **Build Tool**: Wrangler 3
- **Validation**: Zod schema validation

## Quick Start

### Prerequisites

- Node.js 18+ or 20+
- pnpm 8+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Setup

1. Copy environment variables:

```bash
cp .dev.vars.example .dev.vars
```

2. Fill in `.dev.vars`:

```
WORKER_SECRET=your_very_secure_secret_here_min_32_chars
```

3. Install dependencies:

```bash
pnpm install
```

4. Start local development:

```bash
pnpm dev
```

Server runs on `http://localhost:8787`

## Available Scripts

- `pnpm dev` — Start local dev server with Wrangler
- `pnpm deploy` — Deploy to Cloudflare Workers (production)
- `pnpm build` — Build Worker code
- `pnpm types` — Generate TypeScript types from wrangler.toml

## API Endpoints

### POST /download

Download an Instagram Reel.

**Request:**
```bash
curl -X POST http://localhost:8787/download \
  -H "Content-Type: application/json" \
  -H "X-Worker-Secret: your_worker_secret" \
  -d '{"url": "https://www.instagram.com/reels/ABC123/"}'
```

**Required Headers:**
- `Content-Type: application/json`
- `X-Worker-Secret: <WORKER_SECRET>` — Must match `env.WORKER_SECRET`

**Request Body:**
```json
{
  "url": "https://www.instagram.com/reels/ABC123XYZ/"
}
```

**Success Response (200):**
```json
{
  "downloadUrl": "https://example.com/video.mp4",
  "filename": "reel_ABC123XYZ.mp4"
}
```

**Error Responses:**
- `400 Bad Request` — Invalid URL format or validation failed
- `401 Unauthorized` — Missing or invalid X-Worker-Secret header

### GET /health

Health check endpoint.

```bash
curl http://localhost:8787/health
```

**Response:**
```json
{
  "status": "ok"
}
```

## URL Validation

The worker validates Instagram Reel URLs:
- Must be on `instagram.com` or `www.instagram.com`
- Must follow pattern `/reel/...` or `/reels/...`
- Examples:
  - ✅ `https://instagram.com/reels/ABC123/`
  - ✅ `https://www.instagram.com/reel/ABC123XYZ/`
  - ❌ `https://instagram.com/p/ABC123/` (post, not reel)
  - ❌ `https://example.com/video` (not Instagram)

## Security

- **Header Validation**: X-Worker-Secret uses constant-time comparison
- **Input Validation**: All inputs validated with Zod schemas
- **Content-Type Check**: Only accepts `application/json`
- **URL Validation**: Strict Instagram Reel URL validation

## Environment Variables

| Variable | Required | Example |
|---|---|---|
| `WORKER_SECRET` | Yes | `sk_secret_abc123xyz...` |
| `ENVIRONMENT` | No | `development` or `production` |

## Deployment

Deploy to Cloudflare Workers:

```bash
pnpm deploy
```

Ensure you have `wrangler.toml` configured with your Cloudflare account and zone information.

## Next Steps

- [ ] Integrate real yt-dlp binary for actual video extraction
- [ ] Add rate limiting middleware
- [ ] Add request logging
- [ ] Implement video quality selection
- [ ] Add CORS headers if needed

## Learn More

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Zod Validation](https://zod.dev)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
