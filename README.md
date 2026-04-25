# ReelSave Pro ⚡

> India's cleanest Instagram Reel downloader. No watermarks. No stored content. ₹99/month for unlimited.

## Quick Links
| | |
|---|---|
| 📋 Current sprint | [STATUS.md](./STATUS.md) |
| 🏛️ Architecture decisions | [DECISIONS.md](./DECISIONS.md) |
| 🤖 AI agent config | [AGENTS.md](./AGENTS.md) — [agents/backend.md](./agents/backend.md) — [agents/frontend.md](./agents/frontend.md) |
| 🛠️ Local setup | [docs/setup.md](./docs/setup.md) |
| 🧠 Claude Code config | [CLAUDE.md](./CLAUDE.md) |

## Owners
| Person | Domain | Branch prefix |
|---|---|---|
| Prashant | Backend, API, Infra, Payments | `prashant/` |
| Friend | Frontend, Design, Marketing | `friend/` |

## Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Hosting | Vercel |
| Scraping | Cloudflare Workers + yt-dlp |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Payments | Razorpay |

## For AI Agents
If you are Claude Code, Cursor, Codex, or Copilot:

1. **Read `CLAUDE.md` first** — it has the stack, locked decisions, and ownership map
2. **Read `AGENTS.md`** — it defines your scope and communication protocol
3. **Read `STATUS.md`** — it tells you what's done and what's blocking
4. **Load the relevant skill** for your task type (see `skills/` directory)
5. **Never deviate from `DECISIONS.md`** without creating a new ADR entry

## License
Private — not open source.
