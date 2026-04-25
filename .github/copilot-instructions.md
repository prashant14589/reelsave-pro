# ReelSave Pro — Copilot Instructions

## Stack (locked — do not change)

- Next.js 14 App Router + Tailwind CSS
- Supabase (Postgres + Auth + RLS)
- Cloudflare Workers (download/scraping layer)
- Razorpay (payments — India only)
- yt-dlp (video extraction, runs in CF Worker)
- Hosting: Vercel (frontend) + Cloudflare (worker)

## Non-negotiable rules

1. NEVER store Instagram video content on any server — proxy stream only
2. NEVER trust isPremium from the client — always verify via Supabase service role
3. NEVER commit .env.local or .dev.vars
4. EVERY public API route needs Zod validation + rate limiting
5. Razorpay webhook MUST verify HMAC-SHA256 signature before any DB write
6. All UI must work at 375px width first (Indian mobile users)
7. Read STATUS.md at start of every session before writing code

## Ownership

- apps/web/app/api/ → backend (Prashant)
- workers/ → backend (Prashant)
- supabase/migrations/ → backend (Prashant)
- apps/web/app/ pages + components/ → frontend

## Current phase

Phase 1 — Foundation. See STATUS.md for task board.
