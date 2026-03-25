'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'

export async function logOpeningStock(
  preparationId: string,
  quantity: number,
  kitchenUserId?: string | null,
): Promise<{ error: string | null }> {
  if (quantity < 0) return { error: 'La quantitat no pot ser negativa' }

  const supabase = await createServerClient()

  const { error } = await supabase.from('production_logs').insert({
    preparation_id: preparationId,
    type: 'opening',
    quantity,
    logged_at: new Date().toISOString(),
    expires_at: null,
    notes: null,
    kitchen_user_id: kitchenUserId ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  return { error: null }
}

export async function logProduction(
  preparationId: string,
  quantity: number,
  shelfLifeHours: number,
  lotNumber?: string,
  kitchenUserId?: string | null,
): Promise<{ error: string | null }> {
  if (quantity <= 0) return { error: 'La quantitat ha de ser major que 0' }

  const supabase = await createServerClient()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + shelfLifeHours * 60 * 60 * 1000)

  const { error } = await supabase.from('production_logs').insert({
    preparation_id: preparationId,
    type: 'production',
    quantity,
    logged_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    notes: null,
    batch_number: lotNumber?.trim() || null,
    kitchen_user_id: kitchenUserId ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  return { error: null }
}
