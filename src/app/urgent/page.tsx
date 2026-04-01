import { requireAuth } from '@/lib/require-auth'
import { createServerClient } from '@/lib/supabase'
import { SidebarServer } from '@/components/SidebarServer'
import { LoteCard, type LotResult } from '@/components/LoteCard'
import { URGENT_LOOKAHEAD_DAYS, LOCALE } from '@/lib/constants'

export default async function UrgentPage(): Promise<React.JSX.Element> {
  const session = await requireAuth()
  const supabase = await createServerClient()

  const now = new Date()
  const startOfDayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + URGENT_LOOKAHEAD_DAYS).toISOString()

  const [logsResult, exitsResult] = await Promise.all([
    supabase
      .from('production_logs')
      .select('id, production_id, quantity, logged_at, expires_at, batch_number, productions!inner(name, unit, station)')
      .eq('kitchen_user_id', session.userId)
      .not('batch_number', 'is', null)
      .not('expires_at', 'is', null)
      .lt('expires_at', startOfDayAfterTomorrow)
      .order('expires_at', { ascending: true }),
    supabase
      .from('stock_exit_lots')
      .select('batch_number, quantity')
      .eq('kitchen_user_id', session.userId),
  ])

  if (logsResult.error) {
    return <pre className="p-8 text-red-500">{logsResult.error.message}</pre>
  }

  // Sum exited quantity per batch_number
  const exitedByBatch = new Map<string, number>()
  for (const row of exitsResult.data ?? []) {
    const bn = String(row.batch_number)
    exitedByBatch.set(bn, (exitedByBatch.get(bn) ?? 0) + Number(row.quantity))
  }

  const tomorrowStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString()

  type UrgentLot = LotResult & { bucket: 'critical' | 'warning' | 'tomorrow' }

  const lots: UrgentLot[] = []
  for (const row of logsResult.data ?? []) {
    const prod = Array.isArray(row.productions) ? row.productions[0] : row.productions
    const produced = Number(row.quantity)
    const exited = exitedByBatch.get(String(row.batch_number)) ?? 0
    const remaining = produced - exited
    if (remaining <= 0) continue

    const expiresAt = new Date(row.expires_at)
    const bucket: UrgentLot['bucket'] =
      expiresAt.toDateString() === tomorrowStr ? 'tomorrow'
      : expiresAt <= now ? 'critical'
      : 'warning'
    lots.push({
      id: row.id,
      production_id: row.production_id,
      lot_number: row.batch_number ?? null,
      preparation_name: prod.name,
      unit: prod.unit,
      quantity: remaining,
      logged_at: row.logged_at,
      expires_at: row.expires_at,
      station: prod.station,
      bucket,
    })
  }

  const critical = lots.filter((l) => l.bucket === 'critical')
  const warning = lots.filter((l) => l.bucket === 'warning')
  const tomorrow = lots.filter((l) => l.bucket === 'tomorrow')

  // Group critical lots by expiry day (oldest first from query order)
  const criticalByDay = new Map<string, { label: string; lots: typeof critical }>()
  const todayStr = now.toDateString()
  const yesterdayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString()
  for (const lot of critical) {
    const dayStr = new Date(lot.expires_at!).toDateString()
    if (!criticalByDay.has(dayStr)) {
      let label: string
      if (dayStr === todayStr) {
        label = 'Avui'
      } else if (dayStr === yesterdayStr) {
        label = 'Ahir'
      } else {
        label = new Date(dayStr).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'short' })
      }
      criticalByDay.set(dayStr, { label, lots: [] })
    }
    criticalByDay.get(dayStr)!.lots.push(lot)
  }
  const criticalDays = [...criticalByDay.values()]

  return (
    <div className="flex min-h-screen">
      <SidebarServer />
      <main className="flex-1 bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Urgent</h1>
            <p className="text-base text-gray-500 capitalize mt-0.5 md:text-lg">
              {new Date().toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </header>

          {lots.length === 0 ? (
            <p className="text-center text-gray-400 text-lg py-16">Sense alertes urgents</p>
          ) : (
            <div className="flex flex-col gap-6">
              {critical.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-red-600 mb-3">Caducats</h2>
                  {criticalDays.length === 1 ? (
                    <div className="flex flex-col gap-2">
                      {criticalDays[0].lots.map((lot) => <LoteCard key={lot.id} lot={lot} variant="critical" showSale />)}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {criticalDays.map((group, i) => (
                        <details key={group.label} open={i === criticalDays.length - 1} className="group rounded-xl bg-red-50 px-3 py-2">
                          <summary className="flex items-center justify-between list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden py-1">
                            <span className="text-sm font-semibold text-red-600 capitalize">{group.label} <span className="text-red-400 font-normal">({group.lots.length})</span></span>
                            <svg
                              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="text-red-400 transition-transform group-open:rotate-180"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </summary>
                          <div className="flex flex-col gap-2 mt-2">
                            {group.lots.map((lot) => <LoteCard key={lot.id} lot={lot} variant="critical" showSale />)}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </section>
              )}
              {warning.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-600 mb-3">Caduca avui</h2>
                  <div className="flex flex-col gap-2">
                    {warning.map((lot) => <LoteCard key={lot.id} lot={lot} variant="warning" showSale />)}
                  </div>
                </section>
              )}
              {tomorrow.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-500 mb-3">Caduca demà</h2>
                  <div className="flex flex-col gap-2">
                    {tomorrow.map((lot) => <LoteCard key={lot.id} lot={lot} variant="tomorrow" showSale />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
