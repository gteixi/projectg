'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { type Station, type ActionResult } from '@/types/database'
import { createPrepSchema, updatePrepSchema, getRecipeSchema, deactivateSchema } from '@/lib/validation'

interface PrepData {
  name: string
  unit: string
  shelf_life_hours: number | null
  station: Station
  recipe?: string | null
  recipe_photos?: string[]
}

export async function createPreparation(data: PrepData): Promise<ActionResult> {
  const parsed = createPrepSchema.safeParse({
    ...data,
    recipe: data.recipe ?? null,
    recipe_photos: data.recipe_photos ?? [],
  })
  if (!parsed.success) return { error: 'Dades invàlides' }

  const session = await requireAuth()
  const supabase = await createServerClient()
  const { error } = await supabase.from('productions').insert({
    ...parsed.data,
    active: true,
    kitchen_user_id: session.userId,
  })
  if (error) return { error: error.message }
  revalidatePath('/produccions', 'page')
  return { error: null }
}

export async function updatePreparation(
  id: string,
  data: PrepData
): Promise<ActionResult> {
  const parsed = updatePrepSchema.safeParse({
    id,
    ...data,
    recipe: data.recipe ?? null,
    recipe_photos: data.recipe_photos ?? [],
  })
  if (!parsed.success) return { error: 'Dades invàlides' }

  const session = await requireAuth()
  const supabase = await createServerClient()
  const { error } = await supabase.from('productions').update({
    name: parsed.data.name,
    unit: parsed.data.unit,
    shelf_life_hours: parsed.data.shelf_life_hours,
    station: parsed.data.station,
    recipe: parsed.data.recipe,
    recipe_photos: parsed.data.recipe_photos,
  }).eq('id', parsed.data.id).eq('kitchen_user_id', session.userId)
  if (error) return { error: error.message }
  revalidatePath('/produccions', 'page')
  return { error: null }
}

export async function getProductionRecipe(
  productionId: string
): Promise<{ recipe: string | null; recipe_photos: string[] } | null> {
  const parsed = getRecipeSchema.safeParse({ productionId })
  if (!parsed.success) return null

  const session = await requireAuth()
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('productions')
    .select('recipe, recipe_photos')
    .eq('id', parsed.data.productionId)
    .eq('kitchen_user_id', session.userId)
    .single()
  return data ? { recipe: data.recipe ?? null, recipe_photos: data.recipe_photos ?? [] } : null
}

export async function deactivatePreparation(id: string): Promise<ActionResult> {
  const parsed = deactivateSchema.safeParse({ id })
  if (!parsed.success) return { error: 'Dades invàlides' }

  const session = await requireAuth()
  const supabase = await createServerClient()
  const { error } = await supabase.from('productions').update({ active: false }).eq('id', parsed.data.id).eq('kitchen_user_id', session.userId)
  if (error) return { error: error.message }
  revalidatePath('/produccions', 'page')
  return { error: null }
}
