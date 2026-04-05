import { requireAuth } from '@/lib/require-auth'
import { createServerClient } from '@/lib/supabase'
import { SidebarServer } from '@/components/SidebarServer'
import { type LotResult } from '@/components/LoteCard'
import { UrgentClient, type UrgentData } from '@/components/UrgentClient'
import { URGENT_LOOKAHEAD_DAYS, LOCALE } from '@/lib/constants'
import { fetchExitedByBatch } from '@/lib/stock-helpers'

export default async function UrgentPage(): Promise<React.JSX.Element> {
  const session = await requireAuth()
  const supabase = await createServerClient()

  const now = new Date()
  const startOfDayAfterTomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + URGENT_LOOKAHEAD_DAYS)).toISOString()

  const logsResult = await supabase
    .from('production_logs')
    .select('id, production_id, quantity, logged_at, expires_at, batch_number, current_station, productions!inner(name, unit, station)')
    .eq('kitchen_user_id', session.userId)
    .not('batch_number', 'is', null)
    .not('expires_at', 'is', null)
    .lt('expires_at', startOfDayAfterTomorrow)
    .order('expires_at', { ascending: true })

  if (logsResult.error) {
    return <pre className="p-8 text-red-500">{logsResult.error.message}</pre>
  }

  const batchNumbers = (logsResult.data ?? []).map((r) => String(r.batch_number))
  const exitedByBatch = await fetchExitedByBatch(supabase, session.userId, batchNumbers)

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
      station: (row.current_station as string | null) ?? prod.station,
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

  const urgentData: UrgentData = { criticalDays, warning, tomorrow }

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

          <UrgentClient data={urgentData} />
        </div>
      </main>
    </div>
  )
}
