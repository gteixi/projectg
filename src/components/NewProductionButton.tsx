'use client'

import { useState, useTransition, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createPreparation } from '@/lib/prep-actions'
import { suggestShelfLife } from '@/lib/ai-actions'
import { uploadRecipePhoto, deleteRecipePhoto, getRecipePhotoUrl } from '@/lib/photo-actions'
import { compressImage } from '@/lib/image-utils'
import { type Station } from '@/types/database'
import { STATIONS, UNITS, type Unit, MIN_PREP_NAME_LENGTH } from '@/lib/constants'

const MAX_PHOTOS = 5

type ShelfUnit = 'hours' | 'days'

interface FormState {
  name: string
  unit: Unit
  shelf_life_value: string
  shelf_unit: ShelfUnit
  station: Station
  recipe: string
}

function emptyForm(): FormState {
  return { name: '', unit: 'kg', shelf_life_value: '', shelf_unit: 'hours', station: 'Partida', recipe: '' }
}

export function NewProductionButton() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }

  function switchShelfUnit(newUnit: 'hours' | 'days') {
    if (newUnit === form.shelf_unit) return
    const raw = parseFloat(form.shelf_life_value)
    if (!isNaN(raw) && raw > 0) {
      const converted = newUnit === 'hours' ? raw * 24 : raw / 24
      const display = Number.isInteger(converted) ? String(converted) : converted.toFixed(1)
      setForm((prev) => ({ ...prev, shelf_unit: newUnit, shelf_life_value: display }))
    } else {
      set('shelf_unit', newUnit)
    }
  }

  async function handleSuggest() {
    if (form.name.trim().length < 2) return
    setSuggesting(true)
    setSuggestionReason(null)
    const result = await suggestShelfLife(form.name)
    setSuggesting(false)
    if (result.suggestion) {
      if (result.suggestion.hours !== null) {
        if (result.suggestion.hours >= 48 && result.suggestion.hours % 24 === 0) {
          set('shelf_life_value', String(result.suggestion.hours / 24))
          set('shelf_unit', 'days')
        } else {
          set('shelf_life_value', String(result.suggestion.hours))
          set('shelf_unit', 'hours')
        }
      }
      setSuggestionReason(result.suggestion.reasoning)
    } else if (result.error) {
      setServerError(result.error)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) return
    setUploading(true)
    setServerError(null)
    const filesToUpload = Array.from(files).slice(0, remaining)
    for (const file of filesToUpload) {
      const compressed = await compressImage(file)
      const fd = new FormData()
      fd.append('file', compressed, 'photo.jpg')
      const result = await uploadRecipePhoto(fd)
      if (result.error) {
        setServerError(result.error)
        break
      }
      if (result.path) {
        setPhotos((prev) => [...prev, result.path!])
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePhotoRemove(path: string) {
    await deleteRecipePhoto(path)
    setPhotos((prev) => prev.filter((p) => p !== path))
  }

  function handleOpen() {
    setForm(emptyForm())
    setPhotos([])
    setErrors({})
    setServerError(null)
    setSuggestionReason(null)
    setOpen(true)
  }

  function handleClose() {
    if (pending) return
    setOpen(false)
  }

  function handleSubmit() {
    const errs: Record<string, string> = {}
    if (form.name.trim().length < MIN_PREP_NAME_LENGTH) errs.name = `Mínim ${MIN_PREP_NAME_LENGTH} caràcters`
    if (form.shelf_life_value !== '') {
      const shelf = parseFloat(form.shelf_life_value)
      if (isNaN(shelf) || shelf <= 0) errs.shelf_life_value = 'Ha de ser major que 0'
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setServerError(null)
    startTransition(async () => {
      const raw = form.shelf_life_value !== '' ? parseFloat(form.shelf_life_value) : null
      const shelfHours = raw !== null && form.shelf_unit === 'days' ? raw * 24 : raw
      const result = await createPreparation({
        name: form.name.trim(),
        unit: form.unit,
        shelf_life_hours: shelfHours,
        station: form.station,
        recipe: form.recipe.trim() || null,
        recipe_photos: photos,
      })
      if (result.error) {
        setServerError(result.error)
      } else {
        router.refresh()
        setOpen(false)
      }
    })
  }

  const inputCls = (field: string) =>
    `h-14 border rounded-xl px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 w-full ${
      errors[field] ? 'border-red-400' : 'border-[#e5e3de]'
    }`
  const selectCls = 'h-14 border border-[#e5e3de] rounded-xl pl-4 pr-10 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 w-full appearance-none'
  const labelCls = 'block text-base font-medium text-gray-600 mb-2'

  const modal = open ? createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Nova producció</h2>
          <button
            onClick={handleClose}
            disabled={pending}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 disabled:opacity-50 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className={labelCls}>Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') handleClose() }}
              disabled={pending}
              placeholder="Ex: Vinagreta de mostassa"
              className={inputCls('name')}
              autoFocus
            />
            {errors.name && <p className="text-sm text-red-600 mt-1.5">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Unitat</label>
              <div className="relative">
                <select value={form.unit} onChange={(e) => set('unit', e.target.value as Unit)} disabled={pending} className={selectCls}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>

            <div>
              <label className={labelCls}>Secció</label>
              <div className="relative">
                <select value={form.station} onChange={(e) => set('station', e.target.value as Station)} disabled={pending} className={selectCls}>
                  {STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-base font-medium text-gray-600">Caducitat <span className="text-gray-400 font-normal">— opcional</span></label>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={pending || suggesting || form.name.trim().length < 2}
                className="h-9 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm mb-2"
              >
                {suggesting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1z" fill="currentColor"/></svg>
                )}
                Suggerir
              </button>
            </div>
            {suggestionReason && (
              <p className="text-sm text-gray-500 mb-2 italic">{suggestionReason}</p>
            )}
            <div className="flex gap-2">
              <input
                type="number" min="1" step="1"
                value={form.shelf_life_value}
                onChange={(e) => set('shelf_life_value', e.target.value)}
                disabled={pending}
                placeholder={form.shelf_unit === 'days' ? 'Ex: 3' : 'Ex: 24'}
                className={inputCls('shelf_life_value') + ' flex-1'}
              />
              <div className="flex h-14 rounded-xl border border-[#e5e3de] bg-white overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => switchShelfUnit('hours')}
                  disabled={pending}
                  className={`px-4 text-base font-semibold transition-colors ${form.shelf_unit === 'hours' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Hores
                </button>
                <button
                  type="button"
                  onClick={() => switchShelfUnit('days')}
                  disabled={pending}
                  className={`px-4 text-base font-semibold transition-colors ${form.shelf_unit === 'days' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Dies
                </button>
              </div>
            </div>
            {errors.shelf_life_value && <p className="text-sm text-red-600 mt-1.5">{errors.shelf_life_value}</p>}
          </div>

          <div>
            <label className={labelCls}>Recepta <span className="text-gray-400 font-normal">— opcional</span></label>
            <textarea
              value={form.recipe}
              onChange={(e) => set('recipe', e.target.value)}
              disabled={pending}
              placeholder="Escriu la recepta o instruccions..."
              rows={3}
              className="border border-[#e5e3de] rounded-xl px-4 py-3 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 w-full resize-none"
            />
          </div>

          <div>
            <label className={labelCls}>Fotos <span className="text-gray-400 font-normal">— opcional, màx {MAX_PHOTOS}</span></label>
            {photos.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {photos.map((path) => (
                  <div key={path} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#e5e3de]">
                    <img src={getRecipePhotoUrl(path)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(path)}
                      disabled={pending}
                      className="absolute top-0.5 right-0.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={pending || uploading}
                className="h-12 px-4 rounded-xl border-2 border-dashed border-[#e5e3de] text-gray-500 text-base font-medium hover:border-gray-400 hover:text-gray-700 disabled:opacity-50 flex items-center gap-2 w-full justify-center"
              >
                {uploading ? (
                  <span className="inline-block w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                )}
                {uploading ? 'Pujant...' : 'Afegir fotos'}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {serverError && <p className="text-base text-red-600">{serverError}</p>}
        </div>

        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button
            onClick={handleClose}
            disabled={pending}
            className="flex-1 h-14 rounded-xl bg-red-100 text-red-700 text-base font-semibold hover:bg-red-200 disabled:opacity-50"
          >
            Cancel·lar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="flex-1 h-14 rounded-xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? 'Desant…' : 'Crear'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      {modal}
      <button
        onClick={handleOpen}
        className="h-12 px-5 rounded-xl bg-gray-900 text-white text-base font-semibold flex items-center gap-2 shrink-0 hover:bg-gray-800"
      >
        <span className="text-xl leading-none">+</span>
        Nova producció
      </button>
    </>
  )
}
