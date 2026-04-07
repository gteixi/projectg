@AGENTS.md

# ProjectG

## Qué es este proyecto
SaaS de gestión de producción de cocina profesional. Permite a los jefes de partida gestionar el stock diario, registrar producciones y controlar caducidades en tiempo real.

## Stack
- Next.js 16.2.1 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Realtime)
- Despliegue en Vercel

## Dispositivo objetivo
Tablet de 10" montada en cocina profesional. La UI debe estar optimizada para:
- Dedos con guantes o húmedos — botones mínimo 48px de alto
- Lectura rápida a distancia — texto mínimo 16px, títulos 20px+
- Uso con una mano — acciones principales siempre visibles sin scroll
- Ambiente con grasa y vapor — alto contraste, sin elementos frágiles

## Diseño
- Layout: sidebar fijo a la izquierda con navegación, contenido principal a la derecha
- Tipografía: DM Sans (Google Fonts) — legible, moderna, no genérica
- Colores semáforo: verde #16a34a, amarillo #ca8a04, rojo #dc2626
- Fondo general: #f8f7f4 (blanco cálido, no puro)
- Tarjetas: fondo blanco #ffffff, borde #e5e3de, border-radius 12px
- Sin sombras decorativas — solo bordes sutiles
- Estaciones con color de acento: Partida → naranja, Congelador → azul, Camara → teal, Timbre → rosa

## Entornos

### REGLA CRÍTICA: NUNCA trabajar contra producción
La base de datos de producción es del cliente y está en uso real. Todo el desarrollo se hace contra Supabase local (Docker). No cambiar `.env.local` para apuntar a producción salvo consulta puntual de solo lectura.

### Desarrollo (por defecto)
- `.env.local` → Supabase local (`http://127.0.0.1:54321`)
- `.env.development.local` → backup de las credenciales locales
- Arrancar: `pnpm db:start`
- Resetear BD: `pnpm db:reset` (re-aplica migraciones + seed)
- Parar: `pnpm db:stop`
- Seed con datos de prueba: `supabase/seed.sql`

### Producción
- Credenciales en `.env.production.local` (nunca se pushea)
- En Vercel las env vars están configuradas en el dashboard
- Proyecto remoto: `pclkioqjytwinidjvmzx.supabase.co`

### Migraciones
- Crear migraciones en `supabase/migrations/` y probar con `pnpm db:reset` en local
- Solo aplicar a producción con `npx supabase db push` cuando estén validadas

## Base de datos (Supabase)
- Multi-tenant: cada kitchen_user = un restaurante. Todas las tablas de datos tienen `kitchen_user_id` (UUID, NOT NULL, FK → kitchen_users)
- **REGLA CRÍTICA**: toda query a tablas de datos DEBE filtrar por `kitchen_user_id` del usuario logueado. Toda INSERT debe incluirlo. Sin excepciones.
- Login por PIN (no Supabase Auth) — el aislamiento se hace en application code, no RLS
- Usuarios de prueba: Guillem (PIN 1111), Demo (PIN 2222)
- Vista principal: daily_stock (production_id, name, unit, shelf_life_hours, station, kitchen_user_id, stock_total, next_expiry)
- Tabla producciones: productions (name, unit, shelf_life_hours, station, active, kitchen_user_id)
- Tabla logs: production_logs (production_id, quantity, logged_at, expires_at, batch_number, kitchen_user_id)
  - quantity siempre positivo — las salidas van en stock_exits
  - batch_number asignado automaticamente por secuencia global
- Tabla salidas: stock_exits (production_id, quantity, reason, kitchen_user_id) + stock_exit_lots (exit_id, batch_number, quantity, kitchen_user_id)
  - reason: 'merma' | 'venta'
  - Descuento de lotes por FIFO automatico o seleccion manual
- Funciones SQL: get_consumption_summary y get_idle_productions aceptan p_user_id como parámetro
- Nunca se borran registros

## Convenciones de código
- Server Components por defecto, Client Components solo cuando hay interactividad
- Mutaciones via Server Actions ('use server') invocadas desde Client Components con useTransition
- Carpeta de componentes: src/components/
- Estilos con Tailwind — sin CSS modules ni styled-components
- Sin librerías de UI externas (no shadcn, no MUI) — componentes propios

## Zona horaria — REGLA CRÍTICA
Los usuarios están en España (Europe/Madrid). El servidor en Vercel corre en UTC. Toda operación con fechas/horas DEBE usar la timezone explícitamente:
- Constante: `TIMEZONE = 'Europe/Madrid'` en `src/lib/constants.ts`
- Formatear fechas: siempre pasar `{ timeZone: TIMEZONE }` a `toLocaleString`, `toLocaleDateString`, `toLocaleTimeString`
- Extraer YYYY-MM-DD de un ISO timestamp: usar `toLocalDateStr(iso)` de `src/lib/format.ts`, NUNCA `.slice(0, 10)` ni `.toISOString().slice(0, 10)`
- Rangos de fecha para queries: usar `toMadridIso(dateStr, time)` para convertir hora local Madrid a UTC ISO
- Comparar si dos timestamps son del mismo día: comparar `toLocalDateStr()` de ambos, NUNCA `.toDateString()`
- Fin del día actual: usar `endOfDayInMadrid()` de `src/lib/format.ts`
- NUNCA usar `getUTCFullYear/getUTCMonth/getUTCDate` para construir fechas visibles al usuario
- NUNCA usar `setUTCHours()` para boundaries de día
- NUNCA usar `new Date(dateStr + 'T00:00:00')` sin convertir a Madrid — en el servidor es UTC

## Lo que NO hacer
- No usar Inter, Roboto ni Arial
- No usar sombras box-shadow decorativas
- No hacer botones menores de 48px de alto
- No poner información crítica en tooltips (invisible en tablet)
- No usar modales excepto para confirmaciones de acciones criticas (produccion, venta)

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->