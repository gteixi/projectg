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
    .single()
  const isFrozen = prod?.station === 'Congelador'

  const now = new Date()
  const expiresAt = isFrozen ? null
    : shelfLifeHours
      ? new Date(now.getTime() + shelfLifeHours * MS_PER_HOUR).toISOString()
      : null

  const { error } = await supabase.from('production_logs').insert({
    production_id: productionId,
    quantity,
    logged_at: now.toISOString(),
    expires_at: expiresAt,
    batch_number: batchNumber,
    kitchen_user_id: session.userId,
  })

  if (error) return { error: error.message, batch_number: null }

  revalidatePath('/afegir', 'page')
  revalidatePath('/urgent', 'page')
  revalidatePath('/historial', 'page')
  revalidatePath('/trazabilidad', 'page')
  return { error: null, batch_number: batchNumber }
}

