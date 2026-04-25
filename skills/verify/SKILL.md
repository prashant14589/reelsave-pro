# SKILL: Test-Driven Verification

**Phase**: Verify  
**Use when**: Before marking any task as Done  
**Rule**: Done means tests pass. Not "seems to work."

---

## Test Pyramid for ReelSave Pro

```
         /\
        /E2E\         ← 2–3 critical user journeys (Playwright)
       /------\
      /Integr.\       ← API endpoints, DB operations (Vitest)
     /----------\
    /  Unit Tests \   ← Pure functions, validation, rate logic (Vitest)
   /--------------\
```

---

## Critical Test Cases (Must Exist Before Launch)

### Download Flow
```typescript
describe('POST /api/download', () => {
  it('returns 400 for non-Instagram URL')
  it('returns 400 for Instagram post (not reel)')
  it('returns 429 after 5 downloads for anonymous user')
  it('returns 200 with downloadUrl for valid reel URL')
  it('increments download count in DB')
  it('does NOT store video content, only metadata')
  it('returns 200 unlimited for premium user')
})
```

### Rate Limiting
```typescript
describe('Rate Limiting', () => {
  it('counts by IP hash for anonymous users')
  it('counts by user_id for logged-in free users')
  it('resets at midnight IST')
  it('premium users bypass rate limit completely')
  it('returns X-RateLimit-Remaining header')
})
```

### Razorpay Subscription
```typescript
describe('Subscription', () => {
  it('rejects payment with invalid signature')
  it('sets is_premium = true on subscription.activated webhook')
  it('sets is_premium = false on subscription.cancelled webhook')
  it('is idempotent — same webhook twice = same outcome')
  it('never trusts client-provided premium status')
})
```

### Frontend (Component tests)
```typescript
describe('DownloadButton', () => {
  it('shows "5 of 5 used" when limit reached')
  it('shows upgrade modal when limit reached and user clicks')
  it('shows loading spinner during download')
  it('shows error message if download fails')
  it('works on 375px width (mobile)')
})
```

---

## E2E Tests (Playwright — run before each deploy)

```typescript
// test/e2e/download.spec.ts
test('free user can download a reel', async ({ page }) => {
  await page.goto('/')
  await page.fill('[data-testid="url-input"]', 'https://www.instagram.com/reel/TEST/')
  await page.click('[data-testid="download-button"]')
  await expect(page.locator('[data-testid="download-link"]')).toBeVisible()
})

test('free user sees upgrade prompt after 5 downloads', async ({ page }) => {
  // ... simulate 5 downloads
  await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible()
})

test('premium user has no rate limit', async ({ page }) => {
  // ... login as premium user
  // ... download 6 times
  await expect(page.locator('[data-testid="rate-limit-warning"]')).not.toBeVisible()
})
```

---

## Definition of Done

A task is DONE when:
- [ ] Tests written and passing (`pnpm test`)
- [ ] TypeScript compiles with no errors (`pnpm build`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Mobile layout verified (375px Chrome DevTools)
- [ ] Error states tested manually
- [ ] STATUS.md updated
- [ ] PR created and description filled out

If any item is unchecked — it's **not done**.

---

## How to Test Locally

```bash
# Unit + integration tests
pnpm test

# E2E tests (requires running dev server)
pnpm dev &
pnpm test:e2e

# Test Cloudflare Worker locally
wrangler dev
curl -X POST http://localhost:8787/download \
  -H "Content-Type: application/json" \
  -H "X-Worker-Secret: dev-secret" \
  -d '{"url": "https://www.instagram.com/reel/ABC123/"}'

# Test rate limiting
# Run the above 6 times — 6th should return 429
```
