# DECISIONS.md — ReelSave Pro Architecture Decisions

> **Rule**: Any architectural decision — even "small" ones — must be logged here BEFORE implementation. This is the single source of truth for why the codebase looks the way it does.

---

## ADR-001: Proxy-only downloads (no content storage)
**Date**: Project start  
**Status**: ✅ Locked  
**Decision**: Instagram media is never written to our servers. The Cloudflare Worker fetches the media and streams it directly to the user's browser. No S3, no temporary disk storage.  
**Why**: Instagram's ToS prohibits scraping/downloading. Storing content = willful infringement. Proxy streaming = defensible "user-initiated retrieval."  
**Implications**: No download history of actual files. Users must re-download if they lose the file. This is acceptable.

---

## ADR-002: Cloudflare Workers for scraping layer
**Date**: Project start  
**Status**: ✅ Locked  
**Decision**: The yt-dlp / scraping logic runs inside a Cloudflare Worker, not on Vercel.  
**Why**: (1) Distributed edge = different IPs per request, harder for Instagram to block. (2) No cold-start latency. (3) Vercel has a 10s timeout on Hobby; CF Workers have 30s+ on paid.  
**Implications**: Worker is a separate deploy (`wrangler deploy`). Has its own secrets in CF dashboard.

---

## ADR-003: Razorpay exclusively for payments
**Date**: Project start  
**Status**: ✅ Locked  
**Decision**: No Stripe, no PayU, no Paytm gateway. Razorpay only.  
**Why**: Native UPI support, subscription API is clean, webhook reliability is high in India, KYC is straightforward for Indian businesses/individuals.  
**Implications**: Payment UI uses Razorpay's hosted checkout. No custom card form.

---

## ADR-004: Supabase for DB + Auth
**Date**: Project start  
**Status**: ✅ Locked  
**Decision**: Supabase (Postgres + Auth + Row Level Security).  
**Why**: Free tier is generous (500MB DB, 50k MAU). Auth out of box = no custom JWT logic. RLS = data isolation between users without application-layer checks.  
**Implications**: All DB access goes through Supabase client or service role. No raw Postgres connections from application code.

---

## ADR-005: Free tier = 5 downloads/day
**Date**: Project start  
**Status**: ✅ Locked (review at 1000 users)  
**Decision**: Anonymous users get 5 downloads/day (IP-based). Logged-in free users get 5/day. Premium = unlimited.  
**Why**: 5 is enough for casual users (drives goodwill), not enough for power users (drives conversion). Below 5 felt punitive; above 10 reduces upgrade urgency.  
**Implications**: Rate limiting is by IP hash for anon users. By user_id for logged-in users. Must survive VPN abuse.

---

## ADR-006: ₹99/month flat pricing, no annual tier at launch
**Date**: Project start  
**Status**: ✅ Locked (review at 500 paying users)  
**Decision**: One premium tier at ₹99/month. No annual discount. No team plans. No lifetime deal.  
**Why**: Simplicity for launch. Annual tier adds complexity (proration, cancellation logic). Lifetime deals attract deal-hunters, not recurring revenue users. Add annual at 6 months if churn data warrants it.  
**Implications**: Razorpay subscription plan ID is fixed. Changing price = new plan + migration logic.

---

## ADR-007: Next.js 14 App Router (not Pages Router)
**Date**: Project start  
**Status**: ✅ Locked  
**Decision**: Use App Router. Server Components where possible.  
**Why**: Better SEO (server-rendered). Simpler data fetching patterns. Vercel edge runtime support. Future-proof.  
**Implications**: No `getServerSideProps` / `getStaticProps` patterns. Use `async` server components and `use client` boundary only where needed (Razorpay checkout, interactive download button).

---

## ADR-008: DPDP Act 2023 compliance
**Date**: Project start  
**Status**: ✅ Locked  
**Decision**: Collect and log explicit user consent before collecting any personal data. Consent stored in `profiles` table.  
**Why**: India's Digital Personal Data Protection Act 2023. Violations carry penalties up to ₹250 crore. We operate in India. Non-negotiable.  
**Implications**: Consent banner on first visit. Consent timestamp stored. Data deletion request flow needed (can be manual via email at launch, automated later).

---

*Add new ADRs below with incrementing numbers.*
