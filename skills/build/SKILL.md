# SKILL: Incremental Build

**Phase**: Build  
**Use when**: Implementing any feature  
**Core principle**: One vertical slice at a time. Working code > complete code.

---

## Build Order for ReelSave Pro

Always build in this sequence:

```
1. API contract first (even if fake response)
2. DB migration (if schema change)
3. Backend logic with tests
4. Frontend integration
5. Error states
6. Mobile layout check
7. Update STATUS.md
```

---

## Cloudflare Worker: Build Checklist

```typescript
// EVERY worker endpoint must have:
// ✅ Input validation (check URL format before calling yt-dlp)
// ✅ Auth check (verify worker secret header)
// ✅ Error boundary (return JSON error, never throw to edge)
// ✅ CORS headers (allow reelsave.app origin only)
// ✅ Rate limit header passthrough (X-RateLimit-Remaining)

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Validate origin
    // 2. Parse and validate input
    // 3. Check rate limit (call Supabase)
    // 4. Execute core logic
    // 5. Log to downloads table
    // 6. Return response
  }
}
```

---

## Next.js API Route: Build Checklist

```typescript
// EVERY route in apps/web/app/api/ must have:
// ✅ Zod schema validation on request body
// ✅ Supabase auth check (if protected route)
// ✅ Rate limit enforcement via downloads table
// ✅ Consistent error response shape: { error: string, code: string }
// ✅ No direct Instagram URLs — always proxied via CF Worker

import { z } from 'zod'

const schema = z.object({ url: z.string().url() })

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
  }
  // ...
}
```

---

## React Component: Build Checklist

```tsx
// EVERY component must have:
// ✅ Loading state (skeleton or spinner)
// ✅ Error state (user-friendly message, not raw error)
// ✅ Empty state (if list/data component)
// ✅ Mobile-first CSS (start at 375px, expand up)
// ✅ No inline styles — Tailwind classes only

// Pattern for async data:
const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

// Pattern for download button (free tier):
// Show counter: "3 of 5 free downloads used today"
// Show upgrade prompt when limit hit
```

---

## Razorpay Integration: Specific Rules

```typescript
// Payment flow:
// 1. Create order on SERVER (never client)
// 2. Open Razorpay checkout on client
// 3. Verify payment signature on SERVER (HMAC-SHA256)
// 4. Update Supabase premium status only after server verification
// 5. NEVER trust client-side payment confirmation

// Webhook handler MUST:
// - Verify razorpay-signature header
// - Handle: subscription.activated, subscription.cancelled, payment.failed
// - Be idempotent (same event can arrive twice)
```

---

## Supabase: Specific Rules

```typescript
// Always use Row Level Security policies
// Never use service role key on the client
// Free tier users: SELECT only own data
// Premium check: always server-side via service role, never trust client claim

// Correct pattern:
const supabase = createServerClient(url, serviceRoleKey) // server only
const { data } = await supabase
  .from('profiles')
  .select('is_premium')
  .eq('id', userId)
  .single()

// WRONG:
const isPremium = request.headers.get('x-is-premium') // NEVER trust this
```

---

## Anti-Patterns to Reject

| Pattern | Why it's wrong | Correct approach |
|---|---|---|
| Storing video blob in Supabase storage | Legal liability | Proxy stream only |
| Calling CF Worker without secret header | Security hole | Always verify `X-Worker-Secret` |
| Setting `is_premium = true` from client | Payment bypass | Only set via webhook handler |
| Skipping loading state | Bad UX on Indian mobile networks (slow 4G) | Always show progress |
| Using `any` type in TypeScript | Makes code unmaintainable | Define interfaces properly |
| Comments like "TODO: add validation" | Never gets done | Add it now or don't ship |
