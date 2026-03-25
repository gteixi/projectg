import { createServerClient } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import { CookBadge } from '@/components/CookBadge'
import { CookAvatarGroup } from '@/components/CookAvatarGroup'
import { HistorialPrepRow, LogDetail } from '@/components/HistorialPrepRow'
import { Preparation } from '@/types/database'

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

type PrepSummary = {
  preparation_id: string
  name: string
  unit: string
  par_quantity: number
  total_produced: number
  reached_par: boolean
  lot_count: number
  entries: LogDetail[]
}

type DaySummary = {
  date: string
  label: string
  preps: PrepSummary[]
  cook_names: string[]
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
    .select('preparation_id, quantity, logged_at, kitchen_user_id, batch_number')
    .in('preparation_id', prepIds)
    .eq('type', 'production')
    .gte('logged_at', sevenDaysAgo.toISOString())

  if (logsError) {
    return <pre className="p-8 text-red-500">{JSON.stringify(logsError, null, 2)}</pre>
  }

  const logs = logsData ?? []

  // Resolve cook names
  const cookIds = [...new Set(logs.map((l) => l.kitchen_user_id).filter(Boolean))] as string[]
  let cookMap = new Map<string, string>()
  if (cookIds.length > 0) {
    const { data: cooks } = await supabase
      .from('kitchen_users')
      .select('id, name')
      .in('id', cookIds)
    cookMap = new Map((cooks ?? []).map((c) => [c.id, c.name]))
  }

  // Group by date → by preparation_id
  type DayLog = { quantity: number; kitchen_user_id: string | null; batch_number: string | null; logged_at: string }
  const byDate = new Map<string, Map<string, DayLog[]>>()

  for (const log of logs) {
    const dateStr = log.logged_at.slice(0, 10)
    if (!byDate.has(dateStr)) byDate.set(dateStr, new Map())
    const byPrep = byDate.get(dateStr)!
    if (!byPrep.has(log.preparation_id)) byPrep.set(log.preparation_id, [])
    byPrep.get(log.preparation_id)!.push({
      quantity: log.quantity,
      kitchen_user_id: log.kitchen_user_id,
      batch_number: log.batch_number,
      logged_at: log.logged_at,
    })
  }

  // Build days array for last 7 days (including days with no production)
  const days: DaySummary[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const byPrep = byDate.get(dateStr)

    const allDayLogs = byPrep ? [...byPrep.values()].flat() : []
    const cook_names = [
      ...new Set(
        allDayLogs
          .map((l) => l.kitchen_user_id && cookMap.get(l.kitchen_user_id))
          .filter(Boolean) as string[]
      ),
    ]

    const prepsForDay: PrepSummary[] = preps
      .filter((p) => byPrep?.has(p.id))
      .map((p) => {
        const entries = byPrep!.get(p.id)!
        const total = entries.reduce((sum, e) => sum + e.quantity, 0)
        const lot_count = new Set(entries.map((e) => e.batch_number).filter(Boolean)).size
        const logDetails: LogDetail[] = entries.map((e) => ({
          lot_number: e.batch_number,
          cook_name: e.kitchen_user_id ? (cookMap.get(e.kitchen_user_id) ?? null) : null,
          quantity: e.quantity,
          unit: p.unit,
          time: new Date(e.logged_at).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }),
        }))
        return {
          preparation_id: p.id,
          name: p.name,
          unit: p.unit,
          par_quantity: p.par_quantity,
          total_produced: total,
          reached_par: total >= p.par_quantity,
          lot_count,
          entries: logDetails,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ca'))

    days.push({
      date: dateStr,
      label: formatDateLabel(dateStr),
      preps: prepsForDay,
      cook_names,
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
                <div className="px-4 py-3 border-b border-[#e5e3de] md:px-6 flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-base font-semibold text-gray-800 capitalize">{day.label}</h2>
                  {day.cook_names.length > 0 && (
                    <>
                      <div className="md:hidden">
                        <CookAvatarGroup names={day.cook_names} />
                      </div>
                      <div className="hidden md:flex flex-wrap gap-1.5">
                        {day.cook_names.map((name) => (
                          <CookBadge key={name} name={name} />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {day.preps.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-400 md:px-6">Sense produccions registrades</p>
                ) : (
                  <ul className="divide-y divide-[#e5e3de]">
                    {day.preps.map((prep) => (
                      <HistorialPrepRow
                        key={prep.preparation_id}
                        name={prep.name}
                        reached_par={prep.reached_par}
                        total_produced={prep.total_produced}
                        par_quantity={prep.par_quantity}
                        unit={prep.unit}
                        lot_count={prep.lot_count}
                        entries={prep.entries}
                      />
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
