# ReelSave Pro Phase 1 — Diagnosis & Next Steps

**Generated**: 2026-04-25  
**Status**: Phase 1 is 85% complete, but downloads don't work yet (critical path blocker)

---

## ✅ What's Actually Working

### Infrastructure

- **Next.js** at `localhost:3000` ✅ Running
- **Cloudflare Worker** at `localhost:8787` ✅ Running
- **Supabase** project created + schema migrations ✅
- **Network**: Next.js → API Route → Worker ✅ Connected

### Frontend (apps/web/app/page.tsx)

- Beautiful, mobile-first download widget ✅
- URL input field, Download button ✅
- Loading state with spinner ✅
- Success/error/ratelimit states ✅
- Free tier counter (localStorage) ✅
- All UI is Tailwind-only (mobile-first 375px) ✅

### API Bridge (apps/web/app/api/download/route.ts)

- Accepts `POST { url: string }` ✅
- Validates Instagram URL with Zod ✅
- Calls Cloudflare Worker with `X-Worker-Secret` header ✅
- Error handling for invalid URLs, worker failures ✅
- Returns worker response to client ✅

### Cloudflare Worker (workers/downloader/src/index.ts)

- Health check: `GET /health` ✅ Works
- Download endpoint: `POST /download` ✅ Accepts requests
- Input validation (Zod) ✅
- Secret authentication ✅
- Proper error responses ✅

---

## ❌ Why Downloads Don't Work

### The Problem

The Worker **returns mock data** instead of real video downloads:

```typescript
// Current Worker response (line ~120 in index.ts)
const mockResponse: DownloadResponse = {
  downloadUrl: "https://example.com/mock-video.mp4",
  filename: "test.mp4",
};
return new Response(JSON.stringify(mockResponse), { status: 200 });
```

When a user clicks the download link, they get a **404 error** because `https://example.com/mock-video.mp4` doesn't exist.

### Root Cause

**Missing Video Extraction Logic**: The Worker needs to:

1. Parse the Instagram Reel URL
2. Extract the actual video stream URL from Instagram
3. Stream that video to the client (proxy-only, never store)

Currently, the Worker just returns a fake URL. No actual Instagram integration yet.

---

## 📊 Architecture Status

```
User Browser (localhost:3000)
      ↓ POST /api/download {url}
Next.js API Route (/api/download)
      ↓ POST /download {url} + X-Worker-Secret
Cloudflare Worker (localhost:8787)
      ↓ BLOCKED: returns mock.mp4 instead of real stream
      ↗ This is why nothing works end-to-end
```

---

## 🔧 Why You Can't Download: The Three Options

### Option A: **RapidAPI (Recommended for Speed)**

**Status**: EASIEST  
**Timeline**: 2-3 hours  
**Cost**: ~$15-50/month (quota-based)

**What it is**: Cloud API that extracts Instagram video URLs for you

**Setup**:

1. RapidAPI key already in `workers/downloader/.dev.vars` ✅
2. Modify Worker to:
   ```typescript
   const rapidApiUrl = "https://instagram-rapid-api.p.rapidapi.com/...";
   const response = await fetch(rapidApiUrl, {
     method: "GET",
     headers: {
       "X-RapidAPI-Key": env.RAPIDAPI_KEY,
       "X-RapidAPI-Host": "...",
     },
   });
   const videoUrl = response.data.video_url;
   // Stream that to user
   ```
3. Test with real Instagram URL
4. Deploy to CF edge

**Pros**:

- Ship in 3 hours
- Handles all Instagram auth & anti-bot
- Scales instantly
- No local dependencies

**Cons**:

- Adds monthly cost
- Quota limits (but good for Phase 1)
- Vendor lock-in

**Verdict**: Best for MVP. Proven API, instant results.

---

### Option B: **Local yt-dlp (Free, But Complex)**

**Status**: HARDER  
**Timeline**: 4-6 hours (with debugging)  
**Cost**: $0 (open source)

**What it is**: Command-line tool that downloads videos from anywhere, including Instagram

**Setup**:

1. Install yt-dlp locally: `choco install yt-dlp` (Windows)
2. Modify Worker to call yt-dlp:
   ```typescript
   const { exec } = require("child_process");
   const output = await exec(
     "yt-dlp -f best -o - https://instagram.com/reel/xyz",
   );
   // Stream output to user
   ```
3. Handle Instagram blocking (they actively block scrapers)
4. Test & deploy

**Pros**:

- Free forever
- Unlimited downloads
- Battle-tested (actively maintained)
- You control everything

**Cons**:

- Requires system binary on CF Worker (complex)
- Instagram blocks constantly (needs yt-dlp updates)
- Harder to debug when Instagram changes auth
- Worker is sandboxed (can't easily run system binaries)

**Verdict**: Better long-term, but risky for MVP timeline.

---

### Option C: **Hybrid (Do Both Sequentially)**

**Phase 1**: Use RapidAPI now

- Ship working download in 3 hours
- Show real videos to first users
- Validate product-market fit

**Phase 2** (Week 3): Migrate to yt-dlp

- Less cost as volume grows
- More control, no quotas
- Phased transition, no downtime

**Verdict**: Smartest for business. Fast MVP + sustainable scaling.

---

## 🎯 My Recommendation

### **Go with Option C (Hybrid): RapidAPI First**

**Why**:

1. ✅ You have the API key already in `.dev.vars`
2. ✅ Unblocks the entire team in 3 hours
3. ✅ Real downloads for real users
4. ✅ Can measure PMF while yt-dlp is being researched
5. ✅ RapidAPI has good documentation + support
6. ✅ Easy to swap out later if quotas get tight

**Next Steps** (in order):

1. **Now (1 hour)**: Choose RapidAPI or stick with yt-dlp research
2. **Hour 2-4**: Implement video extraction in Worker
3. **Hour 5**: Test end-to-end with 3-5 real Instagram Reel URLs
4. **Hour 6**: Update STATUS.md with "READY FOR FRONTEND" annotation
5. **Later**: Switch to yt-dlp when costs matter

---

## 🔍 Current Test Results

| Component              | Test                 | Result                         |
| ---------------------- | -------------------- | ------------------------------ |
| Worker health          | `GET /health`        | ✅ `{status: "ok"}`            |
| Next.js dev            | `localhost:3000`     | ✅ UI loads, no errors         |
| API route exists       | `/api/download`      | ✅ Accepts POST                |
| URL validation         | Invalid URL → error  | ✅ Returns 400 + message       |
| Worker → Mock response | Valid URL → download | ❌ Returns fake URL (mock.mp4) |
| End-to-end flow        | Real Instagram URL   | ❌ Doesn't extract real video  |

---

## 📋 Concrete Action Plan

### If you choose **RapidAPI**:

```typescript
// workers/downloader/src/index.ts (lines 120-150)
// Replace mock response with:

const rapidApiKey = env.RAPIDAPI_KEY;
const rapidApiHost = env.RAPIDAPI_HOST;

const rapidResponse = await fetch(
  `https://instagram-rapid-api.p.rapidapi.com/media/info?url=${encodeURIComponent(url)}`,
  {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": rapidApiHost,
    },
  },
);

const data = await rapidResponse.json();
const videoUrl = data.video_url || data.media_url;

// Return stream proxy instead of mock
return new Response(
  JSON.stringify({ downloadUrl: videoUrl, filename: "reel.mp4" }),
  {
    status: 200,
    headers: { "Content-Type": "application/json" },
  },
);
```

### If you choose **yt-dlp**:

Research + document how to:

1. Call system binary from CF Worker
2. Handle Instagram blocking
3. Stream output to client
   (This needs more investigation — yt-dlp may not work well in CF Workers sandbox)

---

## 💡 Unblocking Path

**Blocked**: Full Phase 1 completion (85% → 100%)  
**Root cause**: No video extraction  
**Solution**: Pick RapidAPI or yt-dlp, implement in Worker, test  
**Timeline**: 3-6 hours depending on choice  
**Owner**: Prashant (backend) — Friend can start Phase 2 frontend work in parallel

---

## 🚀 After This is Fixed

Once downloads work:

1. Friend builds:
   - Premium sign-up flow
   - Auth with Supabase
   - Dashboard to show download history
2. Prashant builds:
   - Razorpay payment integration
   - Rate limiting via Supabase (not just localStorage)
   - Batch download for premium
3. Together:
   - Deploy to production
   - Measure engagement
   - Iterate based on user feedback

---

**Status**: ⏳ Awaiting decision on video extraction method (RapidAPI vs yt-dlp)  
**Next move**: Let me know which you prefer, and I'll implement it immediately.
