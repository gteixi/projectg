'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { Station } from '@/types/database'

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

interface PrepData {
  name: string
  unit: string
  par_quantity: number
  shelf_life_hours: number
  station: Station
}

export async function createPreparation(data: PrepData): Promise<{ error: string | null }> {
  const supabase = await createServerClient()
  const { error } = await supabase.from('preparations').insert({
    ...data,
    restaurant_id: RESTAURANT_ID,
    active: true,
  })
  if (error) return { error: error.message }
  revalidatePath('/preparacions')
  return { error: null }
}

export async function updatePreparation(
  id: string,
  data: PrepData
): Promise<{ error: string | null }> {
  const supabase = await createServerClient()
  const { error } = await supabase.from('preparations').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/preparacions')
  return { error: null }
}

export async function deactivatePreparation(id: string): Promise<{ error: string | null }> {
  const supabase = await createServerClient()
  const { error } = await supabase.from('preparations').update({ active: false }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/preparacions')
  return { error: null }
}
