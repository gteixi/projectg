'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { MS_PER_HOUR } from '@/lib/constants'

export async function extendLotToEndOfDay(
  logId: string,
): Promise<{ error: string | null }> {
  const session = await requireAuth()
  const supabase = await createServerClient()

  // Verify the lot is not frozen
  const { data: log } = await supabase
    .from('production_logs')
    .select('current_station, productions!inner(station)')
    .eq('id', logId)
    .eq('kitchen_user_id', session.userId)
    .single()

  if (!log) return { error: 'Lot no trobat' }

  const prod = Array.isArray(log.productions) ? log.productions[0] : log.productions
  const effectiveStation = log.current_station ?? prod.station
  if (effectiveStation === 'Congelador') {
    return { error: 'No es pot ampliar un lot congelat' }
  }

  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const { error } = await supabase
    .from('production_logs')
    .update({ expires_at: endOfDay.toISOString() })
    .eq('id', logId)
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
  const session = await requireAuth()
  if (quantity <= 0) return { error: 'La quantitat ha de ser major que 0', batch_number: null }

  const supabase = await createServerClient()

  const { count } = await supabase
    .from('production_logs')
    .select('*', { count: 'exact', head: true })
    .eq('batch_number', batchNumber)
    .eq('kitchen_user_id', session.userId)
  if (count && count > 0) return { error: 'Ja existeix una producció amb aquest lot', batch_number: null }

  const { data: prod } = await supabase
    .from('productions')
    .select('station')
    .eq('id', productionId)
    .eq('kitchen_user_id', session.userId)
    .single()
  if (!prod) return { error: 'Producció no trobada', batch_number: null }
  const effectiveStation = station ?? prod.station
  const isFrozen = effectiveStation === 'Congelador'

  const now = new Date()
  const expiresAt = isFrozen ? null
    : shelfLifeHours
      ? new Date(now.getTime() + shelfLifeHours * MS_PER_HOUR).toISOString()
      : null

  const currentStation = station && station !== prod.station ? station : null

  const { error } = await supabase.from('production_logs').insert({
    production_id: productionId,
    quantity,
    logged_at: now.toISOString(),
    expires_at: expiresAt,
    batch_number: batchNumber,
    kitchen_user_id: session.userId,
    ...(currentStation ? { current_station: currentStation } : {}),
  })

  if (error) return { error: error.message, batch_number: null }

  revalidatePath('/afegir', 'page')
  revalidatePath('/urgent', 'page')
  revalidatePath('/historial', 'page')
  revalidatePath('/trazabilidad', 'page')
  return { error: null, batch_number: batchNumber }
}

