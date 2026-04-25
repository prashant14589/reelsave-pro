# SKILL: Spec-Driven Development

**Phase**: Define  
**Use when**: Starting any new feature or significant change in ReelSave Pro  
**Owner trigger**: Either Prashant or Friend starting new work

---

## The Rule
**No code before a spec.** A spec takes 15 minutes. Debugging a misunderstood feature takes days.

---

## Spec Template

Copy this for every new feature:

```markdown
## Feature: [Name]
**Owner**: Prashant | Friend | Both
**Phase**: 1 | 2 | 3 | 4
**Depends on**: [ADR or feature that must exist first]

### What it does (1 sentence)
[Plain English. No jargon.]

### User story
As a [free user | premium user | anonymous visitor],
I want to [action],
So that [outcome].

### Acceptance Criteria
- [ ] [Specific, testable condition 1]
- [ ] [Specific, testable condition 2]
- [ ] [Mobile layout works at 375px]
- [ ] [Error states handled]
- [ ] [Rate limit enforced if API endpoint]

### Out of scope (for this PR)
- [Thing that would be nice but isn't this ticket]

### API contract (if backend work)
POST /api/[endpoint]
Request: { field: type }
Response: { field: type }
Errors: 400 (validation) | 401 (auth) | 429 (rate limit) | 500 (server)

### DB changes
[None | Migration file: supabase/migrations/XXXXXX_name.sql]

### How to test
1. [Step]
2. [Step]
```

---

## ReelSave Pro Specific Spec Examples

### ✅ Good spec (download endpoint)
```
Feature: Core Download API
Owner: Prashant
What it does: Accepts an Instagram URL, validates it, proxies the video stream back.
Acceptance Criteria:
- [ ] POST /api/download accepts { url: string }
- [ ] Validates URL is instagram.com/reel/* or instagram.com/p/*
- [ ] Returns 400 for non-Instagram URLs
- [ ] Returns 429 when free user exceeds 5/day
- [ ] Streams file (not stores it)
- [ ] Logs to downloads table (url + status only, no content)
```

### ❌ Bad spec (vague)
```
Feature: Make download work
Do: Download the video
```

---

## Verification
Before writing code, answer:
1. Can I write a test that would fail if this isn't implemented?
2. Is the mobile experience specified?
3. Is the error case specified?
4. Is the DB impact documented?

If any answer is "no", complete the spec first.
