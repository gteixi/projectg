import { requireAuth } from '@/lib/require-auth'
import { createServerClient } from '@/lib/supabase'
import { SidebarServer } from '@/components/SidebarServer'
import { PrepListClient } from '@/components/PrepListClient'
import { NewProductionButton } from '@/components/NewProductionButton'
import { type StockActualHoy, type ActiveLot } from '@/types/database'

const STOCK_COLUMNS = 'production_id, name, unit, shelf_life_hours, station, stock_total, next_expiry' as const
const LOTS_COLUMNS = 'id, production_id, batch_number, quantity, expires_at, current_station' as const

export default async function Home(): Promise<React.JSX.Element> {
  const session = await requireAuth()
  const supabase = await createServerClient()

  const nowIso = new Date().toISOString()

  const [stockResult, logsResult, expiredLogsResult, exitsResult] = await Promise.all([
    supabase
      .from('daily_stock')
      .select(STOCK_COLUMNS)
      .eq('kitchen_user_id', session.userId)
      .order('name'),
    supabase
      .from('production_logs')
      .select(LOTS_COLUMNS)
      .eq('kitchen_user_id', session.userId)
      .gt('quantity', 0)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .not('batch_number', 'is', null)
      .order('expires_at', { ascending: true, nullsFirst: false }),
    supabase
      .from('production_logs')
      .select(LOTS_COLUMNS)
      .eq('kitchen_user_id', session.userId)
      .gt('quantity', 0)
      .not('expires_at', 'is', null)
      .lte('expires_at', nowIso)
      .not('batch_number', 'is', null)
      .order('expires_at', { ascending: true }),
    supabase
      .from('stock_exit_lots')
      .select('batch_number, quantity')
      .eq('kitchen_user_id', session.userId),
  ])

  if (stockResult.error) {
    return <pre className="p-8 text-red-500">{stockResult.error.message}</pre>
  }

  const exitedByBatch = new Map<string, number>()
  for (const row of exitsResult.data ?? []) {
    const bn = String(row.batch_number)
    exitedByBatch.set(bn, (exitedByBatch.get(bn) ?? 0) + Number(row.quantity))
  }

  const items = (stockResult.data ?? []) as StockActualHoy[]

  function buildLotsMap(logs: typeof logsResult.data): Record<string, ActiveLot[]> {
    const map: Record<string, ActiveLot[]> = {}
    for (const l of logs ?? []) {
      const produced = Number(l.quantity)
      const exited = exitedByBatch.get(String(l.batch_number)) ?? 0
      const remaining = produced - exited
      if (remaining <= 0) continue
      const pid = l.production_id as string
      if (!map[pid]) map[pid] = []
      map[pid].push({
        log_id: l.id as string,
        batch_number: l.batch_number as string,
        quantity: remaining,
        expires_at: l.expires_at as string,
        current_station: (l.current_station as ActiveLot['current_station']) ?? null,
      })
    }
    return map
  }

  const lotsByProduction = buildLotsMap(logsResult.data)
  const expiredLotsByProduction = buildLotsMap(expiredLogsResult.data)

  return (
    <div className="flex min-h-screen">
      <SidebarServer />
      <main className="flex-1 bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <PrepListClient items={items} lotsByProduction={lotsByProduction} expiredLotsByProduction={expiredLotsByProduction} action={<NewProductionButton />} />
        </div>
      </main>
    </div>
  )
}
