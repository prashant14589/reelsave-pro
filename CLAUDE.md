# ReelSave Pro — Claude Code Configuration

## Project Identity
- **Product**: ReelSave Pro — India's cleanest Instagram Reel downloader
- **Pricing**: Free (5 downloads/day + ads) | ₹99/month Premium (unlimited, no ads, batch)
- **Stack**: Next.js 14 (App Router) + Vercel + Cloudflare Workers + Supabase + Razorpay + yt-dlp
- **Target Market**: India-first, Instagram creators, 18–35 age group
- **Go-Live Target**: 8 weeks from project start

## Owners
- **Prashant** → Backend, API layer, Cloudflare Workers, Razorpay, rate limiting, infra
- **Friend** → Frontend/UI, auth flows, dashboard, design, marketing pages, legal

## Locked Decisions (DO NOT REVISIT without updating DECISIONS.md)
| Decision | Choice | Reason |
|---|---|---|
| Downloader engine | yt-dlp via Cloudflare Worker | Battle-tested, maintained, no server storage |
| Payment | Razorpay only | India-first, UPI support, subscription API |
| Database | Supabase (Postgres) | Free tier, auth built-in, realtime |
| Auth | Supabase Auth (Google OAuth + email OTP) | No custom auth infra |
| Content storage | NONE — proxy-only | Legal protection; never store Instagram content |
| Rate limiting | 5 downloads/day/IP for free tier | Drives conversion without blocking |
| Pricing | ₹99/month flat | Simple, India-affordable, no annual complexity yet |
| Legal compliance | DPDP Act 2023 | Indian user data protection |
| Frontend framework | Next.js 14 App Router | Vercel-native, SSR for SEO |

## Repository Structure
```
reelsave-pro/
├── CLAUDE.md              ← You are here (root context)
├── AGENTS.md              ← Multi-agent orchestration rules
├── DECISIONS.md           ← Architecture decision log
├── STATUS.md              ← Current sprint status (update daily)
├── apps/
│   └── web/               ← Next.js frontend (Friend owns)
│       ├── app/           ← App Router pages
│       ├── components/    ← UI components
│       └── lib/           ← Client utilities
├── workers/
│   └── downloader/        ← Cloudflare Worker (Prashant owns)
│       ├── src/index.ts   ← Main worker entry
│       └── wrangler.toml  ← CF config
├── supabase/
│   ├── migrations/        ← DB schema migrations
│   └── functions/         ← Edge functions (if needed)
├── docs/
│   ├── api.md             ← API contracts
│   └── setup.md           ← Local dev setup
└── skills/                ← Agent skill files (this directory)
```

## How to Use Skills
Skills are loaded by Claude Code per task type:
- Starting a new feature? → Load `skills/spec/SKILL.md` first
- Breaking down work? → Load `skills/plan/SKILL.md`
- Writing code? → Load `skills/build/SKILL.md`
- Before merging? → Load `skills/review/SKILL.md`
- Deploying? → Load `skills/ship/SKILL.md`

## Critical Constraints
1. **Never store Instagram content** on any server — proxy download only
2. **Never commit secrets** — use `.env.local` for dev, Vercel env vars for prod
3. **Never skip rate limiting** — free tier abuse kills margins
4. **Always update STATUS.md** after completing a task
5. **Always update DECISIONS.md** before making an architectural choice
6. **Mobile-first UI** — 70%+ of Indian users are on mobile

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CLOUDFLARE_WORKER_URL=
CLOUDFLARE_WORKER_SECRET=
```

## Commands
```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm test         # Run test suite
pnpm lint         # ESLint + TypeScript check
wrangler dev      # Local Cloudflare Worker
wrangler deploy   # Deploy worker to CF edge
```
