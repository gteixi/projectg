import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { URGENT_LOOKAHEAD_DAYS } from '@/lib/constants'
import { fetchExitedByBatch } from '@/lib/stock-helpers'

export async function SidebarServer(): Promise<React.JSX.Element> {
  const session = await getSession()
  if (!session) return <Sidebar urgentCount={0} />

  const supabase = await createServerClient()

  const now = new Date()
  const startOfDayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + URGENT_LOOKAHEAD_DAYS).toISOString()

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
