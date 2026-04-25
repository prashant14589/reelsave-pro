# Local Dev Setup — ReelSave Pro

## Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Wrangler CLI (`pnpm add -g wrangler`)
- Supabase CLI (`pnpm add -g supabase`)
- A Cloudflare account (free)
- A Supabase account (free)
- A Razorpay account (test mode)

---

## Step 1: Clone and Install
```bash
git clone https://github.com/[your-org]/reelsave-pro.git
cd reelsave-pro
pnpm install
```

## Step 2: Environment Variables
```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[service role key — NEVER expose to client]
RAZORPAY_KEY_ID=rzp_test_[your key]
RAZORPAY_KEY_SECRET=[your secret]
CLOUDFLARE_WORKER_URL=http://localhost:8787
CLOUDFLARE_WORKER_SECRET=dev-secret-change-in-prod
```

## Step 3: Supabase Local
```bash
supabase start
supabase db push  # Applies migrations
```

## Step 4: Cloudflare Worker
```bash
cd workers/downloader
cp .dev.vars.example .dev.vars
# Fill in WORKER_SECRET=dev-secret-change-in-prod
wrangler dev
# Worker now running at http://localhost:8787
```

## Step 5: Next.js Dev Server
```bash
cd apps/web
pnpm dev
# App running at http://localhost:3000
```

---

## Common Issues

**"Instagram URL not working in local worker"**  
yt-dlp needs to be installed locally: `pip install yt-dlp`  
Or use a mock response for development: set `MOCK_DOWNLOADS=true` in `.dev.vars`

**"Razorpay webhook not hitting local"**  
Use ngrok: `ngrok http 3000` then set webhook URL in Razorpay dashboard to `https://[ngrok-url]/api/webhooks/razorpay`

**"Supabase RLS blocking queries"**  
In dev, you can temporarily use service role key to debug. Never in production client code.

---

## Testing Razorpay in Test Mode
Use card: `4111 1111 1111 1111`, any future expiry, any CVV.  
UPI: Use `success@razorpay` as UPI ID for test success.
