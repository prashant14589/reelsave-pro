# STATUS.md — ReelSave Pro Sprint Tracker

> **Rule**: Update this file before ending any work session. Agents read this at the start of every session.

---

## 🚦 Current Sprint: Phase 1 — Foundation (Week 1–2)

### Sprint Goal
Get core download API working end-to-end: URL in → video file proxy out. No UI yet. No auth yet. Just the hard technical core.

### Sprint Status: � IN PROGRESS (60% complete)

**Completed:**
- ✅ Next.js 14 scaffold (apps/web) with TypeScript strict + Tailwind + Supabase SSR
- ✅ Cloudflare Worker scaffold (workers/downloader) with POST /download endpoint
- ✅ Supabase database schema (migrations created, RLS policies, helper functions)

**In Progress:**
- 🔄 Test Cloudflare Worker endpoints
- 🔄 Set up Supabase project + run migrations

**Blocked:**
- None

---

## ✅ READY FOR FRONTEND (APIs available to build against)
*None yet — Phase 1 in progress*

---

## 🔴 BLOCKING (needs resolution before work can continue)
*None yet*

---

## 📋 Task Board

### Prashant
| Task | Status | Notes |
|---|---|---|
| Register domain (reelsave.app or similar) | 🔲 Todo | |
| Set up Vercel project + connect GitHub | 🔲 Todo | |
| Set up Supabase project + run migrations | 🔄 In Progress | Migrations ready, need to execute in Supabase UI |
| Research scraping: yt-dlp vs instaloader vs manual | 🔲 Todo | Decision needed |
| Build Cloudflare Worker: POST /download → proxy stream | ✅ Done | Mock endpoint working, ready for yt-dlp integration |
| Implement IP-based rate limiting (5/day free) | 🔲 Todo | After worker verified |
| Set up Razorpay account + KYC | 🔲 Todo | |

### Friend
| Task | Status | Notes |
|---|---|---|
| Set up Razorpay account + KYC | 🔲 Todo | Co-owner needed |
| Define DB schema (see schema below) | ✅ Done | Migrations created with RLS + helper functions |
| Wireframes: landing page + download flow | 🔲 Todo | Figma or Excalidraw |
| Set up Next.js project in apps/web | ✅ Done | Running on localhost:3000 with Supabase SSR client |

---

## 📊 DB Schema (draft — Prashant to finalise in migration)

```sql
-- users (managed by Supabase Auth)
-- profiles (extended user data)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  is_premium boolean default false,
  premium_since timestamptz,
  premium_expires timestamptz,
  downloads_today integer default 0,
  last_download_reset date default current_date,
  created_at timestamptz default now()
);

-- downloads (audit log — no content stored)
create table downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  ip_hash text,           -- hashed IP for rate limiting anonymous users
  instagram_url text,     -- input URL only, not the content
  status text,            -- success | failed | rate_limited
  created_at timestamptz default now()
);

-- subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  razorpay_subscription_id text unique,
  razorpay_plan_id text,
  status text,            -- active | cancelled | expired
  current_period_end timestamptz,
  created_at timestamptz default now()
);
```

---

## 📝 Daily Standups

### Template
```
### [Prashant/Friend] — [YYYY-MM-DD]
**Done**: 
**Doing**: 
**Blocked**: 
```

*(Add entries below — newest at top)*

### Claude (Copilot) — 2026-04-25
**Done**: 
- ✅ Scaffolded Next.js 14 project (apps/web) with TypeScript strict, Tailwind, Supabase SSR
- ✅ Scaffolded Cloudflare Worker (workers/downloader) with POST /download endpoint
- ✅ Implemented request validation (Zod), Instagram URL validation, X-Worker-Secret auth
- ✅ Created Supabase migrations with full schema, RLS policies, triggers, helper functions
- ✅ Set up pnpm, installed all dependencies, verified both dev servers running

**Doing**: 
- Next: Set up actual Supabase project and run migrations
- Next: Test Worker endpoints end-to-end
- Next: Integrate yt-dlp into Worker for real video extraction

**Blocked**: 
- None — Phase 1 infrastructure complete

---

## 🔗 Key Links
| Resource | URL |
|---|---|
| Vercel Dashboard | TBD after setup |
| Supabase Dashboard | TBD after setup |
| Razorpay Dashboard | TBD after setup |
| Cloudflare Dashboard | TBD after setup |
| Figma/Wireframes | TBD |
| Domain | TBD |
