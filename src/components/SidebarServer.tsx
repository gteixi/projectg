import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { URGENT_LOOKAHEAD_DAYS } from '@/lib/constants'

export async function SidebarServer(): Promise<React.JSX.Element> {
  const session = await getSession()
  const supabase = await createServerClient()

  const now = new Date()
  const startOfDayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + URGENT_LOOKAHEAD_DAYS).toISOString()

  const [logsResult, exitsResult] = await Promise.all([
    supabase
      .from('production_logs')
      .select('production_id, batch_number, quantity')
      .eq('kitchen_user_id', session?.userId ?? '')
      .not('batch_number', 'is', null)
      .not('expires_at', 'is', null)
      .lt('expires_at', startOfDayAfterTomorrow),
    supabase
      .from('stock_exit_lots')
      .select('batch_number, quantity')
      .eq('kitchen_user_id', session?.userId ?? ''),
  ])

  const exitedByBatch = new Map<string, number>()
  for (const row of exitsResult.data ?? []) {
    const bn = String(row.batch_number)
    exitedByBatch.set(bn, (exitedByBatch.get(bn) ?? 0) + Number(row.quantity))
  }

  let urgentLots = 0
  for (const log of logsResult.data ?? []) {
    const remaining = Number(log.quantity) - (exitedByBatch.get(String(log.batch_number)) ?? 0)
    if (remaining > 0) urgentLots++
  }

  return <Sidebar urgentCount={urgentLots} />
}
