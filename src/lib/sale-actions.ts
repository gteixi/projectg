'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { type SaleReason, type ActiveLot, type FifoBreakdown, type ActionResult } from '@/types/database'

export async function getActiveLots(
  productionId: string
): Promise<{ lots: ActiveLot[]; error: string | null }> {
  await requireAuth()
  const supabase = await createServerClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [logsResult, exitsResult] = await Promise.all([
    supabase
      .from('production_logs')
      .select('id, batch_number, quantity, expires_at')
      .eq('production_id', productionId)
      .gt('quantity', 0)
      .gte('logged_at', todayStart.toISOString())
      .not('expires_at', 'is', null)
      .gt('expires_at', new Date().toISOString())
      .not('batch_number', 'is', null)
      .order('expires_at', { ascending: true }),
    supabase
      .from('stock_exit_lots')
      .select('batch_number, quantity'),
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
): Promise<ActionResult> {
  await requireAuth()
  const supabase = await createServerClient()

  const { data: exitData, error: exitError } = await supabase
    .from('stock_exits')
    .insert({
      production_id: productionId,
      quantity,
      reason,
    })
    .select('id')
    .single()

  if (exitError) return { error: exitError.message }

  const { error: lotsError } = await supabase
    .from('stock_exit_lots')
    .insert(lots.map((l) => ({
      exit_id: (exitData as { id: string }).id,
      batch_number: l.batch_number,
      quantity: l.quantity,
    })))

  if (lotsError) return { error: lotsError.message }

  revalidatePath('/', 'layout')
  return { error: null }
}
