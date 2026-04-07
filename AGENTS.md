<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ProjectG (Kitchen Management)

A restaurant kitchen management app. Next.js 16 App Router + Supabase + React 19 + Tailwind v4 + TypeScript strict.

## Stack

- **Next.js 16.2.1** — Turbopack is the default bundler for both `dev` and `build`. No webpack config.
- **React 19.2.4** — Server Components by default. `'use client'` only when strictly needed.
- **Supabase** via `@supabase/ssr` — use `createBrowserClient` for client components, `createServerClient` for server components (reads cookies).
- **Tailwind v4** — uses `@tailwindcss/postcss` plugin. No `tailwind.config.js`; config lives in CSS.
- **TypeScript strict mode** — never use `any`, never suppress errors with `!` unless the value is guaranteed non-null.

## Key Rules

### Before writing any Next.js code
Always read the relevant doc in `node_modules/next/dist/docs/` first. The API surface differs from your training data.

### Next.js 16 breaking changes to know
- `params` and `searchParams` in pages/layouts are now `Promise<...>` — always `await` them.
- `turbopack` config is top-level in `next.config.ts`, not under `experimental`.
- Linting uses the ESLint CLI (`eslint`), not `next lint`.
- Middleware convention is deprecated; use `proxy` instead.
- APIs previously prefixed `unstable_` may have been stabilized — check the docs.

### Server vs Client components
- Default to Server Components. Fetch data on the server.
- Only add `'use client'` when the component needs: state, event handlers, browser APIs, or lifecycle hooks.
- Push `'use client'` boundaries as deep (leaf) as possible to keep the server bundle large.
- Never import server-only code (Supabase server client, env secrets) into client components.

### Supabase
- Server Components → `createServerClient` from `@supabase/ssr` (requires cookie handling via `next/headers`).
- Client Components → `createBrowserClient` from `@supabase/ssr`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client; only `NEXT_PUBLIC_*` vars are safe.

### TypeScript
- Strict mode is on — no `as any`, no `@ts-ignore`.
- Prefer `unknown` over `any` when the type is genuinely unknown.
- Type Supabase responses explicitly; don't rely on `data as SomeType` casts without validation.

### Timezone (CRITICAL)
- Users are in `Europe/Madrid`. Server runs in UTC (Vercel).
- Always use `TIMEZONE` from `src/lib/constants.ts` and the helpers in `src/lib/format.ts`.
- Use `toLocalDateStr(iso)` to extract `YYYY-MM-DD` in Madrid time. Never `.slice(0, 10)`.
- Use `toMadridIso(dateStr, time)` for query date boundaries. Never `new Date(str + 'T00:00:00').toISOString()`.
- All `toLocaleString`/`toLocaleDateString`/`toLocaleTimeString` calls MUST include `{ timeZone: TIMEZONE }`.
- Never use `getUTCFullYear/Month/Date`, `setUTCHours`, or `.toDateString()` for date logic.

### Code style
- No comments unless the logic is non-obvious.
- No JSDoc on components or utilities unless explicitly requested.
- Tailwind classes only — no inline styles, no CSS modules for new code.
- Keep components small and focused. Extract to `src/components/` when reused.
- Business logic and data fetching go in `src/lib/`. Types go in `src/types/`.

## Project structure
```
src/
  app/                    # Next.js App Router pages and layouts
    page.tsx              # Home: prep list grouped by station (Server Component)
    urgent/page.tsx       # Lots expiring today/tomorrow (Server Component)
    trazabilidad/page.tsx # Lot search (Server Component + client wrapper)
    historial/page.tsx    # 7-day activity history (Server Component)
  components/             # Shared React components (Toast, Sidebar, PrepCard, SalePanel, etc.)
  lib/                    # Supabase clients (supabase.ts server, supabase-browser.ts client), Server Actions, helpers
  types/                  # TypeScript types (database.ts)
```
