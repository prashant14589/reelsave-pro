# SKILL: Code Review & Quality Gates

**Phase**: Review  
**Use when**: Before merging any PR  
**Standard**: "Would a cautious senior engineer approve this in a fintech-adjacent product?"

---

## Five-Axis Review

### 1. Security (highest priority for ReelSave Pro)
- [ ] No secrets, keys, or tokens in code
- [ ] No direct Instagram URL calls from browser
- [ ] Payment status not trusted from client
- [ ] Razorpay webhook signature verified
- [ ] Input validated with Zod before use
- [ ] Supabase RLS policies not bypassed
- [ ] Worker secret header checked on every CF Worker call
- [ ] No `console.log` with user data (IP, email) in production paths

### 2. Legal Compliance
- [ ] No Instagram content stored server-side
- [ ] DPDP consent not bypassed
- [ ] Privacy policy linked in footer of any page collecting data
- [ ] Download log contains URL + status only (not content)

### 3. Correctness
- [ ] Tests cover the happy path
- [ ] Tests cover the failure path (bad URL, rate limit hit, payment fail)
- [ ] Rate limit logic tested
- [ ] Premium status upgrade/downgrade tested

### 4. Mobile UX (India context)
- [ ] Works at 375px width
- [ ] Works on slow 4G (check bundle size, lazy load where possible)
- [ ] Loading states present for all async operations
- [ ] Error messages in plain English (not "Error code 42")
- [ ] Touch targets ≥ 44px

### 5. Maintainability
- [ ] No TypeScript `any` without comment explaining why
- [ ] Function names describe what they do
- [ ] Magic numbers extracted to named constants
- [ ] DECISIONS.md updated if architectural choice made

---

## Instant Rejection Criteria
**Reject PR immediately if any of these are true:**

🚫 Hardcoded secret or API key  
🚫 `is_premium = req.body.isPremium` (client-trusted payment status)  
🚫 Instagram video content stored in DB or file system  
🚫 Payment webhook without signature verification  
🚫 Public API endpoint without rate limiting  
🚫 `// TODO: add error handling`  

---

## PR Description Template

```markdown
## What
[One paragraph: what does this PR do]

## Why
[Why was this needed — link to STATUS.md task or ADR]

## Testing
- [ ] Unit tests added/updated
- [ ] Tested on mobile (375px)
- [ ] Error case tested
- [ ] Rate limit behavior tested (if relevant)

## Screenshots (if UI change)
[Mobile screenshot] [Desktop screenshot]

## DECISIONS.md updated?
[ ] Yes — ADR-XXX added
[x] No change to architecture

## STATUS.md updated?
[x] Yes
```

---

## Multi-Model Review Pattern
For critical paths (payment, rate limiting, auth):
1. Write with Claude Code / Cursor
2. Review with a second model (e.g., ChatGPT or Gemini) by pasting the function
3. Ask: "What security issues do you see in this code?"
4. Resolve any findings before merging

This is the same approach used for Resume Fixer AI — it works.
