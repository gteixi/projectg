'use server'

import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/require-auth'

export async function uploadRecipePhoto(formData: FormData): Promise<{ path: string | null; error: string | null }> {
  const session = await requireAuth()
  const file = formData.get('file') as File | null
  if (!file) return { path: null, error: 'No file provided' }

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
  if (!path.startsWith(`${session.userId}/`)) return { error: 'No tens permís per eliminar aquesta foto' }
  const supabase = await createServerClient()
  const { error } = await supabase.storage.from('recipe-photos').remove([path])
  if (error) return { error: error.message }
  return { error: null }
}

