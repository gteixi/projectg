import { createServerClient } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import { Preparation } from '@/types/database'

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

type PrepSummary = {
  preparation_id: string
  name: string
  unit: string
  par_quantity: number
  total_produced: number
  reached_par: boolean
}

type DaySummary = {
  date: string
  label: string
  preps: PrepSummary[]
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default async function HistorialPage() {
  const supabase = await createServerClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: prepsData, error: prepsError } = await supabase
    .from('preparations')
    .select('id, name, par_quantity, unit')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('active', true)

  if (prepsError) {
    return <pre className="p-8 text-red-500">{JSON.stringify(prepsError, null, 2)}</pre>
  }

  const preps = (prepsData ?? []) as Pick<Preparation, 'id' | 'name' | 'par_quantity' | 'unit'>[]
  const prepMap = new Map(preps.map((p) => [p.id, p]))
  const prepIds = preps.map((p) => p.id)

  if (prepIds.length === 0) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
          <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
            <header className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Historial</h1>
              <p className="text-base text-gray-500 mt-0.5 md:text-lg">Últims 7 dies</p>
            </header>
            <p className="text-center text-gray-400 text-lg py-16">Sense preparacions</p>
          </div>
        </main>
      </div>
    )
  }

  const { data: logsData, error: logsError } = await supabase
    .from('production_logs')
    .select('preparation_id, quantity, logged_at')
    .in('preparation_id', prepIds)
    .eq('type', 'production')
    .gte('logged_at', sevenDaysAgo.toISOString())

  if (logsError) {
    return <pre className="p-8 text-red-500">{JSON.stringify(logsError, null, 2)}</pre>
  }

  const logs = logsData ?? []

  // Group by date then by preparation_id, summing quantities
  const byDate = new Map<string, Map<string, number>>()

  for (const log of logs) {
    const dateStr = log.logged_at.slice(0, 10)
    if (!byDate.has(dateStr)) byDate.set(dateStr, new Map())
    const byPrep = byDate.get(dateStr)!
    byPrep.set(log.preparation_id, (byPrep.get(log.preparation_id) ?? 0) + log.quantity)
  }

  // Build days array for last 7 days (including days with no production)
  const days: DaySummary[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const prepTotals = byDate.get(dateStr)

    const prepsForDay: PrepSummary[] = preps
      .filter((p) => prepTotals?.has(p.id))
      .map((p) => {
        const total = prepTotals!.get(p.id)!
        return {
          preparation_id: p.id,
          name: p.name,
          unit: p.unit,
          par_quantity: p.par_quantity,
          total_produced: total,
          reached_par: total >= p.par_quantity,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ca'))

    days.push({
      date: dateStr,
      label: formatDateLabel(dateStr),
      preps: prepsForDay,
    })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Historial</h1>
            <p className="text-base text-gray-500 mt-0.5 md:text-lg">Últims 7 dies</p>
          </header>

          <div className="flex flex-col gap-4 md:gap-5">
            {days.map((day) => (
              <div
                key={day.date}
                className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#e5e3de] md:px-6">
                  <h2 className="text-base font-semibold text-gray-800 capitalize">{day.label}</h2>
                </div>

                {day.preps.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-400 md:px-6">Sense produccions registrades</p>
                ) : (
                  <ul className="divide-y divide-[#e5e3de]">
                    {day.preps.map((prep) => (
                      <li
                        key={prep.preparation_id}
                        className="flex items-center gap-3 px-4 py-3 md:px-6"
                      >
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 ${prep.reached_par ? 'bg-green-600' : 'bg-red-600'}`}
                        />
                        <span className="flex-1 text-base font-medium text-gray-900 min-w-0 truncate">
                          {prep.name}
                        </span>
                        <span
                          className={`text-sm font-semibold tabular-nums shrink-0 ${prep.reached_par ? 'text-green-700' : 'text-red-700'}`}
                        >
                          {prep.total_produced} / {prep.par_quantity} {prep.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
