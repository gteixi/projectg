'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { MS_PER_HOUR } from '@/lib/constants'
import { extendLotSchema, logProductionSchema } from '@/lib/validation'

export async function extendLotToEndOfDay(
  logId: string,
): Promise<{ error: string | null }> {
  const parsed = extendLotSchema.safeParse({ logId })
  if (!parsed.success) return { error: 'Dades invàlides' }

  const session = await requireAuth()
  const supabase = await createServerClient()

  const { data: log } = await supabase
    .from('production_logs')
    .select('current_station, productions!inner(station)')
    .eq('id', parsed.data.logId)
    .eq('kitchen_user_id', session.userId)
    .single()

  if (!log) return { error: 'Lot no trobat' }

  const prod = Array.isArray(log.productions) ? log.productions[0] : log.productions
  const effectiveStation = log.current_station ?? prod.station
  if (effectiveStation === 'Congelador') {
    return { error: 'No es pot ampliar un lot congelat' }
  }

  const now = new Date()
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))

  const { error } = await supabase
    .from('production_logs')
    .update({ expires_at: endOfDay.toISOString() })
    .eq('id', parsed.data.logId)
    .eq('kitchen_user_id', session.userId)

  if (error) return { error: error.message }

  revalidatePath('/urgent', 'page')
  revalidatePath('/historial', 'page')
  revalidatePath('/trazabilidad', 'page')
  return { error: null }
}

export async function reserveBatchNumber(): Promise<{ batch_number: string | null; error: string | null }> {
  await requireAuth()
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('nextval_batch_number')
  if (error) return { batch_number: null, error: error.message }
  return { batch_number: data as string, error: null }
}

export type ProductionResult = { error: string | null; batch_number: string | null }

export async function logProduction(
  productionId: string,
  quantity: number,
  shelfLifeHours: number | null,
  batchNumber: string,
  station?: string | null,
): Promise<ProductionResult> {
  const parsed = logProductionSchema.safeParse({
    productionId, quantity, shelfLifeHours: shelfLifeHours ?? null, batchNumber, station: station ?? null,
  })
  if (!parsed.success) {
    const fields = parsed.error.issues.map(i => i.path.join('.')).join(', ')
    return { error: `Dades invàlides (${fields})`, batch_number: null }
  }

  const session = await requireAuth()
  const supabase = await createServerClient()

  const { count } = await supabase
    .from('production_logs')
    .select('*', { count: 'exact', head: true })
    .eq('batch_number', parsed.data.batchNumber)
    .eq('kitchen_user_id', session.userId)
  if (count && count > 0) return { error: 'Ja existeix una producció amb aquest lot', batch_number: null }

  const { data: prod } = await supabase
    .from('productions')
    .select('station')
    .eq('id', parsed.data.productionId)
    .eq('kitchen_user_id', session.userId)
    .single()
  if (!prod) return { error: 'Producció no trobada', batch_number: null }
  const effectiveStation = parsed.data.station ?? prod.station
  const isFrozen = effectiveStation === 'Congelador'

  const now = new Date()
  const expiresAt = isFrozen ? null
    : parsed.data.shelfLifeHours
      ? new Date(now.getTime() + parsed.data.shelfLifeHours * MS_PER_HOUR).toISOString()
      : null

  const currentStation = parsed.data.station && parsed.data.station !== prod.station ? parsed.data.station : null

  const { error } = await supabase.from('production_logs').insert({
    production_id: parsed.data.productionId,
    quantity: parsed.data.quantity,
    logged_at: now.toISOString(),
    expires_at: expiresAt,
    batch_number: parsed.data.batchNumber,
    kitchen_user_id: session.userId,
    ...(currentStation ? { current_station: currentStation } : {}),
  })

  if (error) return { error: error.message, batch_number: null }

  revalidatePath('/produccions', 'page')
  revalidatePath('/urgent', 'page')
  revalidatePath('/historial', 'page')
  revalidatePath('/trazabilidad', 'page')
  return { error: null, batch_number: parsed.data.batchNumber }
}

