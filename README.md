# ProjectG

Kitchen production management SaaS. Track daily stock, log productions, and monitor expiry dates in real time.

Built for 10" tablets in professional kitchen environments.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Postgres + Realtime)
- Vercel

## Development

```bash
pnpm db:start          # Start local Supabase
pnpm dev               # Start dev server
```

Requires a running local Supabase instance. See `.env.local` for connection details.

### Useful commands

```bash
pnpm db:reset          # Reset DB (re-apply migrations + seed)
pnpm db:stop           # Stop local Supabase
pnpm build             # Production build
```
