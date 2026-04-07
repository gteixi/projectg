'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { type SaleReason, type ExitReason, type ActiveLot, type FifoBreakdown, type ActionResult } from '@/types/database'
import { fetchExitedByBatch } from '@/lib/stock-helpers'
import { saleExitSchema, getRecipeSchema } from '@/lib/validation'
import { toMadridIso } from '@/lib/format'
import { LOCALE, TIMEZONE } from '@/lib/constants'

export async function getActiveLots(
  productionId: string
): Promise<{ lots: ActiveLot[]; error: string | null }> {
  const parsed = getRecipeSchema.safeParse({ productionId })
  if (!parsed.success) return { lots: [], error: 'Dades invàlides' }

  const session = await requireAuth()
  const supabase = await createServerClient()

  const madridToday = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const todayStartIso = toMadridIso(madridToday, '00:00:00.000')

  const logsResult = await supabase
    .from('production_logs')
    .select('id, batch_number, quantity, expires_at, current_station')
    .eq('production_id', productionId)
    .eq('kitchen_user_id', session.userId)
    .gt('quantity', 0)
    .gte('logged_at', todayStartIso)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .not('batch_number', 'is', null)
    .order('expires_at', { ascending: true, nullsFirst: false })

  if (logsResult.error) return { lots: [], error: logsResult.error.message }

  const batchNumbers = (logsResult.data ?? []).map((l) => String(l.batch_number))
  const exitedByBatch = await fetchExitedByBatch(supabase, session.userId, batchNumbers)

  const lots: ActiveLot[] = []
  for (const l of logsResult.data ?? []) {
    const produced = Number(l.quantity)
    const exited = exitedByBatch.get(String(l.batch_number)) ?? 0
    const remaining = produced - exited
    if (remaining <= 0) continue
    lots.push({
      log_id: l.id as string,
      batch_number: l.batch_number as string,
      quantity: remaining,
      expires_at: l.expires_at as string,
      current_station: (l.current_station as ActiveLot['current_station']) ?? null,
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
  const parsed = saleExitSchema.safeParse({
    productionId, quantity, reason, lots, exitReason: exitReason ?? null,
  })
  if (!parsed.success) return { error: 'Dades invàlides' }

  const session = await requireAuth()
  const supabase = await createServerClient()

  const { error } = await supabase.rpc('create_sale_exit', {
    p_production_id: parsed.data.productionId,
    p_quantity: parsed.data.quantity,
    p_reason: parsed.data.reason,
    p_kitchen_user_id: session.userId,
    p_lots: parsed.data.lots.map((l) => ({ batch_number: l.batch_number, quantity: l.quantity })),
    p_exit_reason: parsed.data.exitReason ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/produccions', 'page')
  revalidatePath('/urgent', 'page')
  revalidatePath('/historial', 'page')
  revalidatePath('/informe', 'page')
  revalidatePath('/trazabilidad', 'page')
  return { error: null }
}
