# ProjectG

Kitchen production management SaaS. Track daily stock, log productions, and monitor expiry dates in real time.

https://github.com/user-attachments/assets/87434289-435a-4460-ba94-895a428f4cb7

## DDBB

<img width="2644" height="1622" alt="ddbb" src="https://github.com/user-attachments/assets/85ec018b-6e95-49e8-8343-0cd5d7295564" />


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
