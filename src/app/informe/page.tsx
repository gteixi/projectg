import { requireAuth } from '@/lib/require-auth'
import { createServerClient } from '@/lib/supabase'
import { SidebarServer } from '@/components/SidebarServer'
import { DatePicker } from '@/components/DatePicker'
import { formatDateLabel } from '@/lib/format'
import { type Station } from '@/types/database'

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
  await requireAuth()
  const supabase = await createServerClient()

  const { dia } = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const selectedDate = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : today
  const singleDay = !!dia

  // Single day: date_from = date_to = selected. Default: last 7 days.
  const dateTo = selectedDate
  const dateFrom = singleDay ? selectedDate : (() => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() - 6)
    return d.toISOString().slice(0, 10)
  })()

  const [summaryResult, idleResult] = await Promise.all([
    supabase.rpc('get_consumption_summary', { date_from: dateFrom, date_to: dateTo }),
    supabase.rpc('get_idle_productions', { date_from: dateFrom, date_to: dateTo }),
  ])

  if (summaryResult.error) return <pre className="p-8 text-red-500">{summaryResult.error.message}</pre>
  if (idleResult.error) return <pre className="p-8 text-red-500">{idleResult.error.message}</pre>

  const rows = (summaryResult.data ?? []) as ConsumptionRow[]
  const idle = (idleResult.data ?? []) as IdleRow[]

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
              <>
                {/* Mobile: tarjetas apiladas */}
                <ul className="divide-y divide-[#e5e3de] md:hidden">
                  {demanda.map((r) => (
                    <li key={r.production_id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{r.name}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATION_COLORS[r.station]}`}>
                          {r.station}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-gray-500">Consum/dia</p>
                          <p className="font-medium text-gray-900">{r.consumoDia.toFixed(1)} {r.unit}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Suggerit/set.</p>
                          <p className="font-medium text-gray-900">{r.sugeridoSemana.toFixed(1)} {r.unit}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Merma</p>
                          <p className={`font-semibold ${r.pctMerma >= 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                            {(r.pctMerma * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Eficiència</p>
                          <p className={`font-semibold ${r.ratioEficiencia > 1.5 ? 'text-red-600' : r.ratioEficiencia > 1.2 ? 'text-yellow-600' : 'text-green-600'}`}>
                            x{r.ratioEficiencia.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Tablet+: tabla */}
                <div className="hidden md:block">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#e5e3de] text-sm text-gray-500">
                        <th className="px-6 py-3 font-medium">Preparació</th>
                        <th className="px-6 py-3 font-medium text-right">Consum/dia</th>
                        <th className="px-6 py-3 font-medium text-right">% Merma</th>
                        <th className="px-6 py-3 font-medium text-right">Eficiència</th>
                        <th className="px-6 py-3 font-medium text-right">Suggerit/setmana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e3de]">
                      {demanda.map((r) => (
                        <tr key={r.production_id}>
                          <td className="px-6 py-3">
                            <span className="font-medium text-gray-900">{r.name}</span>
                            <span className={`ml-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATION_COLORS[r.station]}`}>
                              {r.station}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-gray-900">
                            {r.consumoDia.toFixed(1)} {r.unit}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`font-semibold ${r.pctMerma >= 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                              {(r.pctMerma * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`font-semibold ${r.ratioEficiencia > 1.5 ? 'text-red-600' : r.ratioEficiencia > 1.2 ? 'text-yellow-600' : 'text-green-600'}`}>
                              x{r.ratioEficiencia.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-gray-900">
                            {r.sugeridoSemana.toFixed(1)} {r.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
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

          {/* 4. Preparacions sense moviment */}
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
        </div>
      </main>
    </div>
  )
}
