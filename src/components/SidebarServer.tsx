import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { URGENT_LOOKAHEAD_DAYS, LOCALE, TIMEZONE } from '@/lib/constants'
import { toMadridIso } from '@/lib/format'
import { fetchExitedByBatch } from '@/lib/stock-helpers'

export async function SidebarServer(): Promise<React.JSX.Element> {
  const session = await getSession()
  if (!session) return <Sidebar urgentCount={0} />

  const supabase = await createServerClient()

  const now = new Date()
  const madridToday = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const d = new Date(madridToday + 'T12:00:00')
  d.setDate(d.getDate() + URGENT_LOOKAHEAD_DAYS)
  const futureDate = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  const startOfDayAfterTomorrow = toMadridIso(futureDate, '00:00:00.000')

  const logsResult = await supabase
    .from('production_logs')
    .select('production_id, batch_number, quantity')
    .eq('kitchen_user_id', session.userId)
    .not('batch_number', 'is', null)
    .not('expires_at', 'is', null)
    .lt('expires_at', startOfDayAfterTomorrow)

  const batchNumbers = (logsResult.data ?? []).map((l) => String(l.batch_number))
  const exitedByBatch = await fetchExitedByBatch(supabase, session.userId, batchNumbers)

  let urgentLots = 0
  for (const log of logsResult.data ?? []) {
    const remaining = Number(log.quantity) - (exitedByBatch.get(String(log.batch_number)) ?? 0)
    if (remaining > 0) urgentLots++
  }

  return <Sidebar urgentCount={urgentLots} />
}
