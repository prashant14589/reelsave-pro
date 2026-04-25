# ReelSave Pro — Web Frontend

Next.js 14 App Router frontend for ReelSave Pro.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase (SSR client)
- **Package Manager**: pnpm

## Quick Start

### Prerequisites

- Node.js 18+ or 20+
- pnpm 8+ (`npm install -g pnpm`)

### Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Fill in `.env.local` with your Supabase and other credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDFLARE_WORKER_URL=your_worker_url
CLOUDFLARE_WORKER_SECRET=your_worker_secret
```

3. Install dependencies:

```bash
pnpm install
```

4. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` — Start development server
- `pnpm build` — Build for production
- `pnpm start` — Start production server
- `pnpm lint` — Run ESLint
- `pnpm type-check` — Check TypeScript types

## Project Structure

```
app/              # App Router pages and layouts
├── layout.tsx    # Root layout
├── page.tsx      # Home page
└── globals.css   # Global styles

components/       # Reusable React components
lib/              # Utility functions and client setup
├── supabase.ts   # Supabase client initialization
public/           # Static assets
```

## Mobile-First Design

This project follows a mobile-first approach (375px minimum width) to serve Indian users effectively.

## Notes

- Never store Instagram content on the server — proxy only
- Always validate input on API routes
- Keep TypeScript strict mode enabled
- Maintain Tailwind's mobile-first breakpoints

## Learn More

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
