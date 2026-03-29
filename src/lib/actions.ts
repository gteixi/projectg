'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { MS_PER_HOUR } from '@/lib/constants'

export async function reserveBatchNumber(): Promise<{ batch_number: number | null; error: string | null }> {
  await requireAuth()
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('nextval_batch_number')
  if (error) return { batch_number: null, error: error.message }
  return { batch_number: data as number, error: null }
}

export type ProductionResult = { error: string | null; batch_number: number | null }

export async function logProduction(
  productionId: string,
  quantity: number,
  shelfLifeHours: number | null,
  batchNumber: number,
): Promise<ProductionResult> {
  await requireAuth()
  if (quantity <= 0) return { error: 'La quantitat ha de ser major que 0', batch_number: null }

  const supabase = await createServerClient()
  const now = new Date()
  const expiresAt = shelfLifeHours
    ? new Date(now.getTime() + shelfLifeHours * MS_PER_HOUR).toISOString()
    : null

  const { error } = await supabase.from('production_logs').insert({
    production_id: productionId,
    quantity,
    logged_at: now.toISOString(),
    expires_at: expiresAt,
    batch_number: batchNumber,
  })

  if (error) return { error: error.message, batch_number: null }

  revalidatePath('/', 'layout')
  return { error: null, batch_number: batchNumber }
}

