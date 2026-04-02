'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getRecipePhotoUrl } from '@/lib/photo-utils'

export function RecipePanel({ productionId }: { productionId: string }): React.JSX.Element | null {
  const [recipe, setRecipe] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('productions')
      .select('recipe, recipe_photos')
      .eq('id', productionId)
      .single()
      .then(({ data }) => {
        if (data) {
          setRecipe(data.recipe as string | null)
          setPhotos((data.recipe_photos as string[]) ?? [])
        }
        setLoaded(true)
      })
  }, [productionId])

  if (!loaded) return null

  const hasRecipe = recipe && recipe.trim().length > 0
  const hasPhotos = photos.length > 0

  if (!hasRecipe && !hasPhotos) {
    return <p className="text-sm text-gray-400 italic">Sense recepta ni fotos</p>
  }

  return (
    <>
      <div className="text-sm text-gray-500 space-y-3">
        {hasRecipe && (
          <div>
            <span className="font-semibold text-gray-700">Recepta</span>
            <p className="mt-1 text-gray-600 whitespace-pre-wrap">{recipe}</p>
          </div>
        )}
        {hasPhotos && (
          <div>
            <span className="font-semibold text-gray-700">Fotos</span>
            <div className="mt-1 flex gap-2 overflow-x-auto">
              {photos.map((path) => (
                <button key={path} onClick={() => setViewingPhoto(path)} className="shrink-0">
                  <img
                    src={getRecipePhotoUrl(path)}
                    alt="Foto recepta"
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200 bg-gray-100"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {viewingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setViewingPhoto(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white text-gray-700 flex items-center justify-center text-xl font-bold shadow-md"
            >
              ✕
            </button>
            <img
              src={getRecipePhotoUrl(viewingPhoto)}
              alt="Foto recepta"
              className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  )
}
