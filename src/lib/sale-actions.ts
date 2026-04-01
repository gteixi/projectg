'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { type SaleReason, type ExitReason, type ActiveLot, type FifoBreakdown, type ActionResult } from '@/types/database'

export async function getActiveLots(
  productionId: string
): Promise<{ lots: ActiveLot[]; error: string | null }> {
  const session = await requireAuth()
  const supabase = await createServerClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [logsResult, exitsResult] = await Promise.all([
    supabase
      .from('production_logs')
      .select('id, batch_number, quantity, expires_at')
      .eq('production_id', productionId)
      .eq('kitchen_user_id', session.userId)
      .gt('quantity', 0)
      .gte('logged_at', todayStart.toISOString())
      .not('expires_at', 'is', null)
      .gt('expires_at', new Date().toISOString())
      .not('batch_number', 'is', null)
      .order('expires_at', { ascending: true }),
    supabase
      .from('stock_exit_lots')
      .select('batch_number, quantity')
      .eq('kitchen_user_id', session.userId),
  ])

  if (logsResult.error) return { lots: [], error: logsResult.error.message }

  const exitedByBatch = new Map<string, number>()
  for (const row of exitsResult.data ?? []) {
    const bn = String(row.batch_number)
    exitedByBatch.set(bn, (exitedByBatch.get(bn) ?? 0) + Number(row.quantity))
  }

  const lots: ActiveLot[] = []
  for (const l of logsResult.data ?? []) {
    const produced = Number(l.quantity)
    const exited = exitedByBatch.get(String(l.batch_number)) ?? 0
    const remaining = produced - exited
    if (remaining <= 0) continue
    lots.push({
      log_id: l.id as string,
      batch_number: l.batch_number as number,
      quantity: remaining,
      expires_at: l.expires_at as string,
    })
  }

  return { lots, error: null }
}

export async function createSaleExit(
  productionId: string,
  quantity: number,
  reason: SaleReason,
  lots: FifoBreakdown[],
  exitReason?: ExitReason | null,
): Promise<ActionResult> {
  const session = await requireAuth()
  const supabase = await createServerClient()

  const { error } = await supabase.rpc('create_sale_exit', {
    p_production_id: productionId,
    p_quantity: quantity,
    p_reason: reason,
    p_kitchen_user_id: session.userId,
    p_lots: lots.map((l) => ({ batch_number: l.batch_number, quantity: l.quantity })),
    p_exit_reason: exitReason ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/afegir', 'page')
  revalidatePath('/urgent', 'page')
  revalidatePath('/historial', 'page')
  revalidatePath('/informe', 'page')
  revalidatePath('/trazabilidad', 'page')
  return { error: null }
}
