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
    .select('id, current_station, batch_number, quantity')
    .in('id', logIds)
    .eq('production_id', productionId)
    .eq('kitchen_user_id', session.userId)

  if (!logs || logs.length === 0) return { error: 'Lots no trobats' }

  const now = new Date()
  const nowIso = now.toISOString()
  const isFreezing = targetStation === 'Congelador'
  const newCurrentStation = targetStation === prod.station ? null : targetStation

  // Group lots by the update they need to avoid N+1
  const freezeLotIds: string[] = []
  const unfreezeLotIds: string[] = []
  const moveLotIds: string[] = []
  const moveRecords: { production_id: string; log_id: string; batch_number: string; from_station: string; to_station: string; quantity: number; moved_at: string; kitchen_user_id: string }[] = []

  for (const log of logs) {
    const effectiveStation = (log.current_station as Station | null) ?? prod.station
    if (effectiveStation === targetStation) continue

    moveRecords.push({
      production_id: productionId,
      log_id: log.id,
      batch_number: log.batch_number as string,
      from_station: effectiveStation,
      to_station: targetStation,
      quantity: Number(log.quantity),
      moved_at: nowIso,
      kitchen_user_id: session.userId,
    })

    const comingFromFreezer = effectiveStation === 'Congelador'

    if (isFreezing) {
      freezeLotIds.push(log.id)
    } else if (comingFromFreezer) {
      unfreezeLotIds.push(log.id)
    } else {
      moveLotIds.push(log.id)
    }
  }

  // Batch: freeze (set expires_at = NULL)
  if (freezeLotIds.length > 0) {
    const { error } = await supabase
      .from('production_logs')
      .update({ current_station: newCurrentStation, expires_at: null })
      .in('id', freezeLotIds)
      .eq('kitchen_user_id', session.userId)
    if (error) return { error: error.message }
  }

  // Batch: unfreeze (recalculate expires_at)
  if (unfreezeLotIds.length > 0) {
    const newExpiresAt = prod.shelf_life_hours
      ? new Date(now.getTime() + prod.shelf_life_hours * MS_PER_HOUR).toISOString()
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

    const { error } = await supabase
      .from('production_logs')
      .update({ current_station: newCurrentStation, expires_at: newExpiresAt })
      .in('id', unfreezeLotIds)
      .eq('kitchen_user_id', session.userId)
    if (error) return { error: error.message }
  }

  // Batch: simple move (no expiry change)
  if (moveLotIds.length > 0) {
    const { error } = await supabase
      .from('production_logs')
      .update({ current_station: newCurrentStation })
      .in('id', moveLotIds)
      .eq('kitchen_user_id', session.userId)
    if (error) return { error: error.message }
  }

  if (moveRecords.length > 0) {
    const { error } = await supabase.from('lot_moves').insert(moveRecords)
    if (error) return { error: error.message }
  }

  revalidatePath('/afegir', 'page')
  revalidatePath('/urgent', 'page')
  revalidatePath('/historial', 'page')
  revalidatePath('/trazabilidad', 'page')
  return { error: null }
}
