'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getRecipePhotoUrl } from '@/lib/photo-utils'

function formatShelfLife(hours: number): string {
  if (hours >= 24) {
    const days = Math.round(hours / 24)
    return `${days} ${days === 1 ? 'dia' : 'dies'}`
  }
  return `${hours}h`
}

export function ShelfLifeInfo({ hours, productionId, onToggle, onEdit, align }: { hours: number | null; productionId: string; onToggle?: (open: boolean) => void; onEdit?: () => void; align?: 'right' }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [recipe, setRecipe] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (!open || loaded) return
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
  }, [open, loaded, productionId])

  function toggle() {
    const next = !open
    setOpen(next)
    onToggle?.(next)
  }

  const hasRecipe = recipe && recipe.trim().length > 0
  const hasPhotos = photos.length > 0

  return (
    <>
      <button
        onClick={toggle}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          align === 'right' ? 'ml-auto' : ''
        } ${
          open ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      {open && (
        <div className="basis-full h-0" aria-hidden="true" />
      )}
      {open && (
        <div className="basis-full text-sm text-gray-500 space-y-3">
          <div>
            {hours != null ? (
              <>Caducitat: <span className="font-semibold text-gray-700">{formatShelfLife(hours)}</span></>
            ) : (
              <span className="font-semibold text-gray-700">Sense caducitat</span>
            )}
            {onEdit && (
              <>
                <span className="mx-1.5 text-gray-300">·</span>
                <button onClick={onEdit} className="font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                  Editar producció
                </button>
              </>
            )}
          </div>
          {loaded && hasRecipe && (
            <div>
              <span className="font-semibold text-gray-700">Recepta</span>
              <p className="mt-1 text-gray-600 whitespace-pre-wrap">{recipe}</p>
            </div>
          )}
          {loaded && hasPhotos && (
            <div>
              <span className="font-semibold text-gray-700">Fotos</span>
              <div className="mt-1 flex gap-2 overflow-x-auto">
                {photos.map((path) => (
                  <button key={path} onClick={() => setViewingPhoto(path)} className="shrink-0">
                    <img
                      src={getRecipePhotoUrl(path)}
                      alt="Foto recepta"
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          {loaded && !hasRecipe && !hasPhotos && (
            <p className="text-gray-400 italic">Sense recepta ni fotos</p>
          )}
        </div>
      )}
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
