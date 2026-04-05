'use server'

import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'
import { deletePhotoSchema } from '@/lib/validation'

export async function uploadRecipePhoto(formData: FormData): Promise<{ path: string | null; error: string | null }> {
  const session = await requireAuth()
  const file = formData.get('file') as File | null
  if (!file) return { path: null, error: 'No file provided' }

  if (!file.type.startsWith('image/')) return { path: null, error: 'Tipus de fitxer no vàlid' }
  if (file.size > 5 * 1024 * 1024) return { path: null, error: 'La foto no pot superar 5 MB' }

  const supabase = await createServerClient()
  const ext = 'jpg'
  const fileName = `${session.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from('recipe-photos')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (error) return { path: null, error: error.message }

  return { path: fileName, error: null }
}

export async function deleteRecipePhoto(path: string): Promise<{ error: string | null }> {
  const session = await requireAuth()
  const parsed = deletePhotoSchema.safeParse({ path })
  if (!parsed.success) return { error: 'Ruta de foto invàlida' }
  if (!parsed.data.path.startsWith(`${session.userId}/`)) return { error: 'No tens permís per eliminar aquesta foto' }

  const supabase = await createServerClient()
  const { error } = await supabase.storage.from('recipe-photos').remove([parsed.data.path])
  if (error) return { error: error.message }
  return { error: null }
}

