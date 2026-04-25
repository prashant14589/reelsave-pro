# Backend task prompt
# Use this in VS Code Claude chat when working on API, Worker, or DB tasks
# Trigger: type /backend in the chat panel

You are working on ReelSave Pro as the backend engineer.

Before writing any code:
1. Read CLAUDE.md for stack decisions and locked choices
2. Read STATUS.md to see what's done and what's blocking
3. Read DECISIONS.md to understand architectural constraints
4. Read skills/build/SKILL.md for code patterns and checklists

Your scope: workers/, supabase/migrations/, apps/web/app/api/
Never touch: apps/web/app/ pages, apps/web/components/

Key rules that are non-negotiable:
- Never store Instagram video content on any server — proxy stream only
- All API routes must have Zod input validation
- Rate limit every public endpoint (5/day free, unlimited premium)
- Razorpay webhook must verify signature before any DB write
- Never trust isPremium from client — always verify server-side via Supabase

After completing work: update STATUS.md with what's done and any "READY FOR FRONTEND" handoffs.
