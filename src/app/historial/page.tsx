import { requireAuth } from '@/lib/require-auth'
import { createServerClient } from '@/lib/supabase'
import { SidebarServer } from '@/components/SidebarServer'
import { DatePicker } from '@/components/DatePicker'
import { HistorialClient, type DaySummary } from '@/components/HistorialClient'
import { type LogDetail } from '@/components/HistorialPrepRow'
import { type SaleReason, type ProductionJoin, type ExitLotJoin } from '@/types/database'
import { formatDateLabel, formatTime } from '@/lib/format'
import { HISTORIAL_DAYS, HISTORIAL_LOGS_LIMIT, HISTORIAL_EXITS_LIMIT, HISTORIAL_MOVES_LIMIT } from '@/lib/constants'

type DayItem = DaySummary['items'][number]

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>
}): Promise<React.JSX.Element> {
  const session = await requireAuth()
  const supabase = await createServerClient()

  const { dia } = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const selectedDate = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : today

  const singleDay = !!dia
  const numDays = singleDay ? 1 : HISTORIAL_DAYS

  const endDate = new Date(selectedDate + 'T23:59:59.999')
  const startDate = new Date(selectedDate + 'T00:00:00.000')
  if (!singleDay) startDate.setDate(startDate.getDate() - (HISTORIAL_DAYS - 1))
  const sinceIso = startDate.toISOString()
  const untilIso = endDate.toISOString()

  const [logsResult, exitsResult, movesResult] = await Promise.all([
    supabase
      .from('production_logs')
      .select('production_id, quantity, logged_at, batch_number, productions!inner(name, unit)')
      .eq('kitchen_user_id', session.userId)
      .gte('logged_at', sinceIso)
      .lte('logged_at', untilIso)
      .order('logged_at', { ascending: false })
      .limit(HISTORIAL_LOGS_LIMIT),
    supabase
      .from('stock_exits')
      .select('id, production_id, quantity, reason, exit_reason, logged_at, stock_exit_lots(batch_number, quantity), productions(name, unit)')
      .eq('kitchen_user_id', session.userId)
      .gte('logged_at', sinceIso)
      .lte('logged_at', untilIso)
      .order('logged_at', { ascending: false })
      .limit(HISTORIAL_EXITS_LIMIT),
    supabase
      .from('lot_moves')
      .select('id, production_id, batch_number, from_station, to_station, quantity, moved_at, productions(name, unit)')
      .eq('kitchen_user_id', session.userId)
      .gte('moved_at', sinceIso)
      .lte('moved_at', untilIso)
      .order('moved_at', { ascending: false })
      .limit(HISTORIAL_MOVES_LIMIT),
  ])

  if (logsResult.error) return <pre className="p-8 text-red-500">{logsResult.error.message}</pre>
  if (exitsResult.error) return <pre className="p-8 text-red-500">{exitsResult.error.message}</pre>
  if (movesResult.error) return <pre className="p-8 text-red-500">{movesResult.error.message}</pre>

  type DayLog = { quantity: number; batch_number: string | null; logged_at: string; name: string; unit: string }
  const byDate = new Map<string, Map<string, DayLog[]>>()

  for (const log of logsResult.data ?? []) {
    const prod = Array.isArray(log.productions) ? log.productions[0] : log.productions
    const prodTyped = prod as ProductionJoin
    const dateStr = (log.logged_at as string).slice(0, 10)
    if (!byDate.has(dateStr)) byDate.set(dateStr, new Map())
    const byPrep = byDate.get(dateStr)!
    const pid = log.production_id as string
    if (!byPrep.has(pid)) byPrep.set(pid, [])
    byPrep.get(pid)!.push({
      quantity: log.quantity as number,
      batch_number: log.batch_number as string | null,
      logged_at: log.logged_at as string,
      name: prodTyped.name,
      unit: prodTyped.unit,
    })
  }

  const exitsByDate = new Map<string, { sortTime: string; exit_id: string; name: string; unit: string; quantity: number; reason: SaleReason; exitReason: string | null; lots: { batch_number: string; quantity: number; time: string }[] }[]>()
  for (const exit of exitsResult.data ?? []) {
    const dateStr = (exit.logged_at as string).slice(0, 10)
    if (!exitsByDate.has(dateStr)) exitsByDate.set(dateStr, [])
    const rawProd = exit.productions as ProductionJoin | ProductionJoin[] | null
    const prod = Array.isArray(rawProd) ? rawProd[0] ?? null : rawProd
    const exitLots = (exit.stock_exit_lots as ExitLotJoin[]) ?? []
    exitsByDate.get(dateStr)!.push({
      exit_id: exit.id as string,
      name: prod?.name ?? '—',
      unit: prod?.unit ?? '',
      quantity: exit.quantity as number,
      reason: exit.reason as SaleReason,
      exitReason: (exit.exit_reason as string | null) ?? null,
      lots: exitLots.map((l) => ({ batch_number: l.batch_number, quantity: l.quantity, time: formatTime(exit.logged_at as string) })),
      sortTime: exit.logged_at as string,
    })
  }

  type MoveEntry = { id: string; batch_number: string; from_station: string; to_station: string; quantity: number; moved_at: string; name: string; unit: string; production_id: string }
  const movesByDate = new Map<string, MoveEntry[]>()
  for (const move of movesResult.data ?? []) {
    const rawProd = move.productions as ProductionJoin | ProductionJoin[] | null
    const prod = Array.isArray(rawProd) ? rawProd[0] ?? null : rawProd
    const dateStr = (move.moved_at as string).slice(0, 10)
    if (!movesByDate.has(dateStr)) movesByDate.set(dateStr, [])
    movesByDate.get(dateStr)!.push({
      id: move.id as string,
      batch_number: move.batch_number as string,
      from_station: move.from_station as string,
      to_station: move.to_station as string,
      quantity: Number(move.quantity),
      moved_at: move.moved_at as string,
      name: prod?.name ?? '—',
      unit: prod?.unit ?? '',
      production_id: move.production_id as string,
    })
  }

  const days: DaySummary[] = []
  for (let i = 0; i < numDays; i++) {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() - i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const byPrep = byDate.get(dateStr)

    const prepItems: DayItem[] = []
    if (byPrep) {
      for (const [pid, entries] of byPrep) {
        const total = entries.reduce((sum, e) => sum + e.quantity, 0)
        const lot_count = new Set(entries.map((e) => e.batch_number).filter(Boolean)).size
        const logDetails: LogDetail[] = entries.map((e) => ({
          lot_number: e.batch_number,
          quantity: e.quantity,
          unit: entries[0].unit,
          time: formatTime(e.logged_at),
        }))
        prepItems.push({
          kind: 'prep' as const,
          sortTime: entries[0].logged_at,
          data: { production_id: pid, name: entries[0].name, unit: entries[0].unit, total_produced: total, lot_count, entries: logDetails },
        })
      }
    }

    const saleItems: DayItem[] = (exitsByDate.get(dateStr) ?? []).map(({ sortTime, ...sale }) => ({
      kind: 'sale' as const,
      sortTime,
      data: sale,
    }))

    const moveItems: DayItem[] = []
    const dayMoves = movesByDate.get(dateStr) ?? []
    const moveGroups = new Map<string, MoveEntry[]>()
    for (const m of dayMoves) {
      const key = `${m.production_id}:${m.to_station}:${m.moved_at}`
      if (!moveGroups.has(key)) moveGroups.set(key, [])
      moveGroups.get(key)!.push(m)
    }
    for (const [key, entries] of moveGroups) {
      const first = entries[0]
      moveItems.push({
        kind: 'move' as const,
        sortTime: first.moved_at,
        data: {
          move_group_id: key,
          name: first.name,
          unit: first.unit,
          lot_count: entries.length,
          to_station: first.to_station,
          entries: entries.map((e) => ({
            batch_number: e.batch_number,
            quantity: e.quantity,
            from_station: e.from_station,
            to_station: e.to_station,
            time: formatTime(e.moved_at),
          })),
        },
      })
    }

    const items: DayItem[] = [...prepItems, ...saleItems, ...moveItems].sort((a, b) =>
      b.sortTime.localeCompare(a.sortTime)
    )

    days.push({ date: dateStr, label: formatDateLabel(dateStr), items })
  }

  return (
    <div className="flex min-h-screen">
      <SidebarServer />
      <main className="flex-1 bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Historial</h1>
              <p className="text-base text-gray-500 mt-0.5 md:text-lg">
                {singleDay ? formatDateLabel(selectedDate) : 'Últims 7 dies'}
              </p>
            </div>
            <DatePicker value={selectedDate} basePath="/historial" />
          </header>

          <HistorialClient days={days} />
        </div>
      </main>
    </div>
  )
}
