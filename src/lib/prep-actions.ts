'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { type Station, type ActionResult } from '@/types/database'

interface PrepData {
  name: string
  unit: string
  shelf_life_hours: number | null
  station: Station
}

export async function createPreparation(data: PrepData): Promise<ActionResult> {
  await requireAuth()
  const supabase = await createServerClient()
  const { error } = await supabase.from('productions').insert({
    ...data,
    active: true,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { error: null }
}

export async function updatePreparation(
  id: string,
  data: PrepData
): Promise<ActionResult> {
  await requireAuth()
  const supabase = await createServerClient()
  const { error } = await supabase.from('productions').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { error: null }
}

export async function deactivatePreparation(id: string): Promise<ActionResult> {
  await requireAuth()
  const supabase = await createServerClient()
  const { error } = await supabase.from('productions').update({ active: false }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { error: null }
}
