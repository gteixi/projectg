import { requireAuth } from '@/lib/require-auth'
import { createServerClient } from '@/lib/supabase'
import { SidebarServer } from '@/components/SidebarServer'
import { DatePicker } from '@/components/DatePicker'
import { LogoutButton } from '@/components/LogoutButton'
import { formatDateLabel, toLocalDateStr } from '@/lib/format'
import { type Station, type ExitReason } from '@/types/database'
import { EXIT_REASON_LABELS, LOCALE, TIMEZONE } from '@/lib/constants'
import { DemandaTable } from '@/components/DemandaTable'

const STATION_COLORS: Record<Station, string> = {
  Partida: 'bg-orange-100 text-orange-700',
  Congelador: 'bg-blue-100 text-blue-700',
  Camara: 'bg-teal-100 text-teal-700',
  Timbre: 'bg-pink-100 text-pink-700',
}

type ConsumptionRow = {
  production_id: string
  name: string
  unit: string
  station: Station
  total_venda: number
  total_merma: number
  total_produit: number
  dias_con_actividad: number
}

type IdleRow = {
  production_id: string
  name: string
  unit: string
  station: Station
  total_produit: number
}

export default async function InformePage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>
}): Promise<React.JSX.Element> {
  const session = await requireAuth()
  const supabase = await createServerClient()

  const { dia } = await searchParams
  const todayParts = new Date().toLocaleDateString(LOCALE, { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).split('/')
  const today = `${todayParts[2]}-${todayParts[1]}-${todayParts[0]}`
  const selectedDate = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : today
  const singleDay = !!dia

  // Single day: date_from = date_to = selected. Default: last 7 days.
  const dateTo = selectedDate
  const dateFrom = singleDay ? selectedDate : (() => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() - 6)
    return toLocalDateStr(d.toISOString())
  })()

  const dateToNext = new Date(selectedDate + 'T12:00:00')
  dateToNext.setDate(dateToNext.getDate() + 1)
  const dateToExclusive = toLocalDateStr(dateToNext.toISOString())

  const [summaryResult, idleResult, mermaReasonsResult] = await Promise.all([
    supabase.rpc('get_consumption_summary', { date_from: dateFrom, date_to: dateTo, p_user_id: session.userId }),
    supabase.rpc('get_idle_productions', { date_from: dateFrom, date_to: dateTo, p_user_id: session.userId }),
    supabase
      .from('stock_exits')
      .select('exit_reason, quantity')
      .eq('kitchen_user_id', session.userId)
      .eq('reason', 'merma')
      .gte('logged_at', dateFrom)
      .lt('logged_at', dateToExclusive),
  ])

  if (summaryResult.error) return <pre className="p-8 text-red-500">{summaryResult.error.message}</pre>
  if (idleResult.error) return <pre className="p-8 text-red-500">{idleResult.error.message}</pre>

  const rows = (summaryResult.data ?? []) as ConsumptionRow[]
  const idle = (idleResult.data ?? []) as IdleRow[]

  const mermaByReason = new Map<string, number>()
  for (const row of mermaReasonsResult.data ?? []) {
    const key = (row.exit_reason as string) ?? 'sense_motiu'
    mermaByReason.set(key, (mermaByReason.get(key) ?? 0) + Number(row.quantity))
  }
  const mermaReasonRows = [...mermaByReason.entries()]
    .map(([reason, total]) => ({ reason, total }))
    .sort((a, b) => b.total - a.total)

  // --- Métricas resumen ---
  const totalSalidas = rows.reduce((s, r) => s + r.total_venda + r.total_merma, 0)
  const totalMerma = rows.reduce((s, r) => s + r.total_merma, 0)
  const numProducciones = rows.length

  // --- Tabla de demanda ---
  const demanda = rows
    .map((r) => {
      const consumoDia = r.dias_con_actividad > 0 ? r.total_venda / r.dias_con_actividad : 0
      const totalSalRow = r.total_venda + r.total_merma
      const pctMerma = totalSalRow > 0 ? r.total_merma / totalSalRow : 0
      const ratioEficiencia = r.total_venda > 0 ? r.total_produit / r.total_venda : 0
      return { ...r, consumoDia, pctMerma, sugeridoSemana: consumoDia * 7, ratioEficiencia }
    })
    .sort((a, b) => b.consumoDia - a.consumoDia)

  // --- Alertas ---
  const alertas = demanda
    .filter((r) => r.pctMerma > 0.15)
    .sort((a, b) => b.pctMerma - a.pctMerma)
    .slice(0, 4)

  return (
    <div className="flex min-h-screen">
      <SidebarServer />
      <main className="flex-1 bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Informe</h1>
              <p className="text-base text-gray-500 mt-0.5 md:text-lg">
                {singleDay ? formatDateLabel(selectedDate) : 'Últims 7 dies'}
              </p>
            </div>
            <DatePicker value={selectedDate} />
          </header>

          {/* 1. Métricas resumen */}
          <div className="grid grid-cols-1 gap-3 mb-6 md:grid-cols-3 md:gap-4">
            <div className="bg-white rounded-xl border border-[#e5e3de] px-4 py-4 flex items-center justify-between md:flex-col md:items-start md:px-6">
              <p className="text-sm text-gray-500">Total sortides</p>
              <p className="text-2xl font-bold text-gray-900 md:mt-1">{totalSalidas}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e5e3de] px-4 py-4 flex items-center justify-between md:flex-col md:items-start md:px-6">
              <p className="text-sm text-gray-500">Merma total</p>
              <p className="text-2xl font-bold text-red-600 md:mt-1">{totalMerma}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e5e3de] px-4 py-4 flex items-center justify-between md:flex-col md:items-start md:px-6">
              <p className="text-sm text-gray-500">Preparacions</p>
              <p className="text-2xl font-bold text-gray-900 md:mt-1">{numProducciones}</p>
            </div>
          </div>

          {/* 2. Tabla de demanda */}
          <div className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-[#e5e3de] md:px-6">
              <h2 className="text-base font-semibold text-gray-800">Demanda per preparació</h2>
            </div>
            {demanda.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-400 text-base">Sense dades en els últims 7 dies</p>
            ) : (
              <DemandaTable rows={demanda} />
            )}
          </div>

          {/* 3. Alertas */}
          {alertas.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-[#e5e3de] md:px-6">
                <h2 className="text-base font-semibold text-gray-800">Alertes de merma</h2>
              </div>
              <ul className="divide-y divide-[#e5e3de]">
                {alertas.map((r) => {
                  const severe = r.pctMerma > 0.2
                  return (
                    <li key={r.production_id} className="px-4 py-3 flex items-center gap-3 md:px-6">
                      <span className={`flex-shrink-0 w-3 h-3 rounded-full ${severe ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <span className="flex-1 text-gray-900 font-medium">{r.name}</span>
                      <span className={`font-semibold ${severe ? 'text-red-600' : 'text-yellow-600'}`}>
                        {(r.pctMerma * 100).toFixed(0)}% merma
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* 4. Desglossament merma per motiu */}
          {mermaReasonRows.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-[#e5e3de] md:px-6">
                <h2 className="text-base font-semibold text-gray-800">Merma per motiu</h2>
              </div>
              <ul className="divide-y divide-[#e5e3de]">
                {mermaReasonRows.map((r) => {
                  const label = r.reason in EXIT_REASON_LABELS
                    ? EXIT_REASON_LABELS[r.reason as ExitReason]
                    : 'Sense motiu'
                  const pct = totalMerma > 0 ? (r.total / totalMerma) * 100 : 0
                  return (
                    <li key={r.reason} className="px-4 py-3 flex items-center justify-between md:px-6">
                      <span className="font-medium text-gray-900">{label}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-600 w-12 text-right">{pct.toFixed(0)}%</span>
                        <span className="text-sm text-gray-400 w-16 text-right">{r.total}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* 5. Preparacions sense moviment */}
          {idle.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e5e3de] md:px-6">
                <h2 className="text-base font-semibold text-gray-800">Produït sense venda</h2>
                <p className="text-sm text-gray-500 mt-0.5">Preparacions amb producció però 0 sortides en 7 dies</p>
              </div>
              <ul className="divide-y divide-[#e5e3de]">
                {idle.map((r) => (
                  <li key={r.production_id} className="px-4 py-3 flex items-center justify-between md:px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{r.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATION_COLORS[r.station]}`}>
                        {r.station}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{r.total_produit} {r.unit} produïts</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <LogoutButton userName={session.name} />
        </div>
      </main>
    </div>
  )
}
