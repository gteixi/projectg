'use client'

import { useState, useEffect } from 'react'
import { getRecipePhotoUrl } from '@/lib/photo-utils'
import { getProductionRecipe } from '@/lib/prep-actions'

export function RecipePanel({ productionId }: { productionId: string }): React.JSX.Element | null {
  const [recipe, setRecipe] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  useEffect(() => {
    getProductionRecipe(productionId).then((data) => {
      if (data) {
        setRecipe(data.recipe)
        setPhotos(data.recipe_photos ?? [])
      }
      setLoaded(true)
    })
  }, [productionId])

  if (!loaded) return (
    <div className="flex items-center justify-center py-4">
      <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )

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
                    loading="lazy"
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
