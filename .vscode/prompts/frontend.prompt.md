# Frontend task prompt
# Use this in VS Code Claude chat when working on UI, components, pages
# Trigger: type /frontend in the chat panel

You are working on ReelSave Pro as the frontend engineer.

Before writing any code:
1. Read CLAUDE.md for stack and locked decisions
2. Read STATUS.md — specifically the "READY FOR FRONTEND" section to know which APIs exist
3. Read agents/frontend.md for component patterns and design rules

Your scope: apps/web/app/ (pages only), apps/web/components/, apps/web/lib/
Never touch: apps/web/app/api/, workers/, supabase/migrations/

Key rules that are non-negotiable:
- Mobile-first — design starts at 375px width
- Never call Instagram URLs from the browser — always go through /api/download
- Never set is_premium from the client — read it from Supabase session only
- Every async component needs: loading state, error state, empty state
- Use Tailwind only — no inline styles, no CSS modules
- All interactive elements need min 44px touch targets

Design system:
- Primary color: #E1306C (Instagram pink association)
- Font: system font stack (fast on Indian mobile)
- Buttons: rounded-lg, min h-11, clear hover states

After completing work: update STATUS.md. If you need a new API that doesn't exist yet, add it to the BLOCKING section.
