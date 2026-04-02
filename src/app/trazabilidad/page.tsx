import { requireAuth } from '@/lib/require-auth'
import { createServerClient } from '@/lib/supabase'
import { SidebarServer } from '@/components/SidebarServer'
import { type LotResult } from '@/components/LoteCard'
import { TrazabilidadClient } from '@/components/TrazabilidadClient'
import { type ProductionJoin } from '@/types/database'
import { TRAZABILIDAD_FETCH_LIMIT } from '@/lib/constants'

const LOTS_COLUMNS = 'id, production_id, quantity, logged_at, expires_at, batch_number, productions(name, unit, station)' as const

export default async function TrazabilidadPage(): Promise<React.JSX.Element> {
  const session = await requireAuth()
  const supabase = await createServerClient()

  const [logsResult, exitsResult] = await Promise.all([
    supabase
      .from('production_logs')
      .select(LOTS_COLUMNS)
      .eq('kitchen_user_id', session.userId)
      .not('batch_number', 'is', null)
      .order('logged_at', { ascending: false })
      .limit(TRAZABILIDAD_FETCH_LIMIT),
    supabase
      .from('stock_exit_lots')
      .select('batch_number, quantity')
      .eq('kitchen_user_id', session.userId),
  ])

  if (logsResult.error) {
    return <pre className="p-8 text-red-500">{logsResult.error.message}</pre>
  }

  const exitedByBatch = new Map<string, number>()
  for (const row of exitsResult.data ?? []) {
    const bn = String(row.batch_number)
    exitedByBatch.set(bn, (exitedByBatch.get(bn) ?? 0) + Number(row.quantity))
  }

  const allResults: LotResult[] = []
  for (const log of logsResult.data ?? []) {
    const rawPrep = log.productions as ProductionJoin | ProductionJoin[] | null
    const prep = Array.isArray(rawPrep) ? rawPrep[0] ?? null : rawPrep
    const produced = Number(log.quantity)
    const exited = exitedByBatch.get(String(log.batch_number)) ?? 0
    const remaining = produced - exited
    if (remaining <= 0) continue
    allResults.push({
      id: log.id as string,
      production_id: log.production_id as string,
      lot_number: (log.batch_number as string) ?? null,
      preparation_name: prep?.name ?? 'Desconeguda',
      unit: prep?.unit ?? '',
      quantity: remaining,
      logged_at: log.logged_at as string,
      expires_at: log.expires_at as string | null,
      station: prep?.station,
    })
  }

  return (
    <div className="flex min-h-screen">
      <SidebarServer />
      <main className="flex-1 bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-3xl mx-auto px-3 py-4 md:px-6 md:py-7">
          <header className="mb-4 md:mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Lote</h1>
            <p className="text-base text-gray-500 mt-0.5 md:text-lg">Cerca per número de lot o producció</p>
          </header>
          <TrazabilidadClient allResults={allResults} />
        </div>
      </main>
    </div>
  )
}
