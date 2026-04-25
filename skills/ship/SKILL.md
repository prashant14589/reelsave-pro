# SKILL: Shipping & Launch

**Phase**: Ship  
**Use when**: Deploying to production or doing the public launch  
**Rule**: Production is not a testing environment. Launch = checklist complete.

---

## Pre-Deploy Checklist (Every Deploy)

```
Infrastructure
- [ ] All env vars set in Vercel dashboard
- [ ] All secrets set in Cloudflare Worker dashboard
- [ ] Supabase project is on Pro (not Free) if > 10 paying users
- [ ] Razorpay webhook URL pointing to production domain

Code
- [ ] pnpm build passes with zero errors
- [ ] pnpm test passes
- [ ] No console.log with sensitive data
- [ ] No debug flags left on (e.g., SKIP_RATE_LIMIT=true)

Database
- [ ] Migration applied to production Supabase
- [ ] RLS policies active and tested
- [ ] Indexes present on downloads.ip_hash, downloads.created_at

Monitoring
- [ ] Sentry DSN set for frontend error tracking
- [ ] Cloudflare Worker errors routed to email alert
- [ ] Razorpay webhook failures alerting
- [ ] Uptime monitor set (UptimeRobot free tier is fine)
```

---

## Launch Day Checklist (One-Time)

```
Legal
- [ ] Privacy Policy live at /privacy
- [ ] Terms of Service live at /terms
- [ ] Instagram disclaimer visible on homepage: 
      "Download only content you own or have permission to download"
- [ ] DPDP consent banner functional

SEO
- [ ] og:title, og:description, og:image set
- [ ] sitemap.xml present
- [ ] robots.txt present
- [ ] Google Search Console property added

Analytics
- [ ] Plausible or PostHog snippet installed
- [ ] Goal events tracked: download_attempted, download_success, 
      upgrade_modal_shown, upgrade_completed

Payments
- [ ] Razorpay production keys (not test keys)
- [ ] Test payment completed end-to-end in production
- [ ] Subscription cancel flow tested
- [ ] Webhook verified with real Razorpay event

Performance
- [ ] Lighthouse score > 80 on mobile
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1
- [ ] Homepage loads under 3s on throttled 4G
```

---

## Deployment Commands

```bash
# Deploy frontend
git push origin main  # Vercel auto-deploys on push to main

# Deploy Cloudflare Worker
cd workers/downloader
wrangler deploy --env production

# Apply Supabase migration
supabase db push --db-url $PROD_DATABASE_URL

# Verify deployment
curl https://reelsave.app/api/health
# Expected: { "status": "ok", "version": "1.0.0" }
```

---

## Post-Launch: First 48 Hours

Monitor these every 4 hours:
- Cloudflare Worker error rate (should be < 1%)
- Razorpay payment success rate
- Download success rate (log in Supabase `downloads` table)
- Bounce rate on landing page (Plausible)
- Any Sentry errors

**If download success rate drops below 80%**: Instagram likely changed something. Check Worker logs immediately.

---

## Rollback Procedure

```bash
# Frontend rollback (Vercel)
# Go to Vercel dashboard → Deployments → Previous deploy → Promote to Production

# Worker rollback
wrangler rollback --env production

# DB rollback (if migration added column — safe)
# If migration dropped column — no easy rollback. This is why we NEVER drop columns in v1.
```

---

## Marketing Launch (Week 8)

### Day 1 sequence:
1. **9 AM** — Post on r/IndiaTech: "Built an Instagram Reel downloader — no watermarks, no BS"
2. **10 AM** — Product Hunt submission goes live (schedule in advance)
3. **12 PM** — WhatsApp message to personal network with link
4. **2 PM** — Reel #1 on Instagram showing the product (irony = reach)
5. **6 PM** — Post on r/androidapps
6. **Evening** — Reply to every single comment, DM, and review (Day 1 momentum is everything)

### Week 2:
- Reach out to 5 micro-influencers (tools/productivity/creator niche)
- Start ₹3k Meta ad campaign targeting Instagram creators in India
- Publish first SEO article: "How to download Instagram Reels on Android in 2025"
