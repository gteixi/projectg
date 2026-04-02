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
  recipe?: string | null
  recipe_photos?: string[]
}

export async function createPreparation(data: PrepData): Promise<ActionResult> {
  const session = await requireAuth()
  const supabase = await createServerClient()
  const { error } = await supabase.from('productions').insert({
    ...data,
    active: true,
    kitchen_user_id: session.userId,
  })
  if (error) return { error: error.message }
  revalidatePath('/afegir', 'page')
  return { error: null }
}

export async function updatePreparation(
  id: string,
  data: PrepData
): Promise<ActionResult> {
  const session = await requireAuth()
  const supabase = await createServerClient()
  const { error } = await supabase.from('productions').update(data).eq('id', id).eq('kitchen_user_id', session.userId)
  if (error) return { error: error.message }
  revalidatePath('/afegir', 'page')
  return { error: null }
}

export async function deactivatePreparation(id: string): Promise<ActionResult> {
  const session = await requireAuth()
  const supabase = await createServerClient()
  const { error } = await supabase.from('productions').update({ active: false }).eq('id', id).eq('kitchen_user_id', session.userId)
  if (error) return { error: error.message }
  revalidatePath('/afegir', 'page')
  return { error: null }
}
