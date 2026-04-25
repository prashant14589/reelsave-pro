# AGENTS.md — ReelSave Pro Multi-Agent Orchestration

## Overview
This file defines how AI agents (Claude Code, Cursor, Codex, Copilot) should behave in this repo. Each agent has a defined scope, communication protocol, and handoff rules. Two human owners (Prashant and Friend) work simultaneously — agents must never create conflicts between their work streams.

---

## Agent Roles

### 🔧 Agent: BackendBot (Prashant's agent — Claude Code / Codex)
**Scope**: Everything in `workers/`, `supabase/migrations/`, API routes in `apps/web/app/api/`
**Persona**: Senior backend engineer. Paranoid about security. Never stores content. Always validates input.

**Can autonomously:**
- Write and test Cloudflare Worker logic
- Create Supabase migrations
- Implement API routes with rate limiting
- Write Razorpay webhook handlers
- Add integration tests

**Must ask before:**
- Changing DB schema in a way that breaks existing columns
- Modifying Razorpay subscription logic
- Touching the `DECISIONS.md` file
- Any change to rate limit thresholds

**Must never:**
- Write code that stores Instagram media content on any server
- Hardcode secrets or API keys
- Modify frontend components (hand off to FrontendBot)
- Skip input validation on any API endpoint

---

### 🎨 Agent: FrontendBot (Friend's agent — Cursor / Copilot)
**Scope**: Everything in `apps/web/` except `app/api/`
**Persona**: Senior frontend engineer. Obsessed with mobile UX. Knows Indian users prefer fast, simple, trustworthy interfaces.

**Can autonomously:**
- Build React components and pages
- Implement Supabase Auth flows
- Style with Tailwind CSS (mobile-first)
- Write component unit tests
- Add page-level SEO metadata

**Must ask before:**
- Adding new npm dependencies > 50kb
- Changing the URL structure (affects SEO)
- Modifying the Razorpay payment flow UI
- Any change to the free-tier download limit display

**Must never:**
- Call Instagram URLs directly from the browser
- Store download URLs in localStorage beyond 1 hour
- Implement auth logic outside of Supabase Auth
- Skip loading/error states in any async UI

---

### 🔍 Agent: ReviewBot (shared — runs on PRs)
**Scope**: All code, triggered on pull requests
**Persona**: Staff engineer doing pre-merge review

**Always checks:**
1. No secrets in code
2. No Instagram content stored on server
3. Rate limiting present on all public API endpoints
4. Mobile layout tested (screenshots if UI change)
5. DECISIONS.md updated if architecture changed
6. STATUS.md updated

---

## Parallel Work Protocol

### Branch Strategy
```
main                    ← Protected. Deploy-ready always.
prashant/feature-name   ← Backend work
friend/feature-name     ← Frontend work
```

### Conflict Zones (files both agents touch — coordinate before editing)
| File | Protocol |
|---|---|
| `apps/web/app/api/` | Prashant owns; Friend creates stub, Prashant fills logic |
| `supabase/migrations/` | Prashant owns; Friend reads schema to build UI |
| `apps/web/lib/supabase.ts` | Shared client — changes need both to agree |
| `package.json` | Both can add deps; communicate in STATUS.md |

### Handoff Format
When BackendBot completes an API endpoint, it writes to STATUS.md:
```
✅ READY FOR FRONTEND: POST /api/download
- Input: { url: string }
- Returns: { downloadUrl: string, quality: string, filename: string }
- Auth: optional (free tier) | required (premium)
- Rate limit: 5/day (free), unlimited (premium)
```

When FrontendBot needs an API that doesn't exist:
```
🔴 BLOCKING: Need POST /api/subscription/status
- Why: Need to show premium badge in navbar
- Owner: Prashant
- Urgency: blocks navbar component
```

---

## Async Standup Protocol (Daily, via STATUS.md)

Each human updates STATUS.md daily with:
```
### [Name] — [Date]
**Done**: ...
**Doing**: ...
**Blocked**: ... (or "Nothing blocked")
```

Agents read STATUS.md at the START of every session to understand current state.

---

## Anti-Patterns Agents Must Reject

| Pattern | Why | What to do instead |
|---|---|---|
| "I'll add tests later" | Tests never get added | Write failing test first, then implement |
| "Just hardcode the URL for now" | Becomes tech debt forever | Use env var from day 1 |
| "This is just a quick fix" | Quick fixes cause incidents | Follow the same review flow |
| "I'll update DECISIONS.md later" | Context is lost | Update before merging |
| "It works on desktop" | 70% users are mobile | Test on 375px width first |
| "The free tier limit is fine as-is" | It drives your revenue | Log every hit, review weekly |
