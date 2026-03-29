import { requireAuth } from '@/lib/require-auth'
import { createServerClient } from '@/lib/supabase'
import { SidebarServer } from '@/components/SidebarServer'
import { PrepListClient } from '@/components/PrepListClient'
import { NewProductionButton } from '@/components/NewProductionButton'
import { type StockActualHoy, type ActiveLot } from '@/types/database'

const STOCK_COLUMNS = 'production_id, name, unit, shelf_life_hours, station, stock_total, next_expiry' as const
const LOTS_COLUMNS = 'id, production_id, batch_number, quantity, expires_at' as const

export default async function Home(): Promise<React.JSX.Element> {
  await requireAuth()
  const supabase = await createServerClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const nowIso = new Date().toISOString()

  const [stockResult, logsResult, exitsResult] = await Promise.all([
    supabase
      .from('daily_stock')
      .select(STOCK_COLUMNS)
      .order('name'),
    supabase
      .from('production_logs')
      .select(LOTS_COLUMNS)
      .gt('quantity', 0)
      .gte('logged_at', todayStart.toISOString())
      .not('expires_at', 'is', null)
      .gt('expires_at', nowIso)
      .not('batch_number', 'is', null)
      .order('expires_at', { ascending: true }),
    supabase
      .from('stock_exit_lots')
      .select('batch_number, quantity'),
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

  const lotsByProduction: Record<string, ActiveLot[]> = {}
  for (const l of logsResult.data ?? []) {
    const produced = Number(l.quantity)
    const exited = exitedByBatch.get(String(l.batch_number)) ?? 0
    const remaining = produced - exited
    if (remaining <= 0) continue
    const pid = l.production_id as string
    if (!lotsByProduction[pid]) lotsByProduction[pid] = []
    lotsByProduction[pid].push({
      log_id: l.id as string,
      batch_number: l.batch_number as number,
      quantity: remaining,
      expires_at: l.expires_at as string,
    })
  }

  return (
    <div className="flex min-h-screen">
      <SidebarServer />
      <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <PrepListClient items={items} lotsByProduction={lotsByProduction} action={<NewProductionButton />} />
        </div>
      </main>
    </div>
  )
}
