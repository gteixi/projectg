'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { type Station, type ActionResult } from '@/types/database'
import { MS_PER_HOUR } from '@/lib/constants'

export async function moveLots(
  productionId: string,
  logIds: string[],
  targetStation: Station,
): Promise<ActionResult> {
  const session = await requireAuth()
  if (logIds.length === 0) return { error: 'Cap lot seleccionat' }

  const supabase = await createServerClient()

  const { data: prod } = await supabase
    .from('productions')
    .select('shelf_life_hours, station')
    .eq('id', productionId)
    .eq('kitchen_user_id', session.userId)
    .single()

  if (!prod) return { error: 'Producció no trobada' }

  const { data: logs } = await supabase
    .from('production_logs')
    .select('id, current_station')
    .in('id', logIds)
    .eq('production_id', productionId)
    .eq('kitchen_user_id', session.userId)

  if (!logs || logs.length === 0) return { error: 'Lots no trobats' }

  const now = new Date()
  const isFreezing = targetStation === 'Congelador'

  for (const log of logs) {
    const effectiveStation = (log.current_station as Station | null) ?? prod.station
    if (effectiveStation === targetStation) continue

    const comingFromFreezer = effectiveStation === 'Congelador'

    const update: Record<string, unknown> = {
      current_station: targetStation === prod.station ? null : targetStation,
    }

    if (isFreezing) {
      update.expires_at = null
    } else if (comingFromFreezer && prod.shelf_life_hours) {
      update.expires_at = new Date(now.getTime() + prod.shelf_life_hours * MS_PER_HOUR).toISOString()
    }

    const { error } = await supabase
      .from('production_logs')
      .update(update)
      .eq('id', log.id)
      .eq('kitchen_user_id', session.userId)

    if (error) return { error: error.message }
  }

  revalidatePath('/afegir', 'page')
  revalidatePath('/urgent', 'page')
  revalidatePath('/historial', 'page')
  revalidatePath('/trazabilidad', 'page')
  return { error: null }
}
