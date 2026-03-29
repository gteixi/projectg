'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createPreparation } from '@/lib/prep-actions'
import { suggestShelfLife } from '@/lib/ai-actions'
import { type Station } from '@/types/database'
import { STATIONS, UNITS, type Unit, MIN_PREP_NAME_LENGTH } from '@/lib/constants'

type ShelfUnit = 'hours' | 'days'

interface FormState {
  name: string
  unit: Unit
  shelf_life_value: string
  shelf_unit: ShelfUnit
  station: Station
}

function emptyForm(): FormState {
  return { name: '', unit: 'kg', shelf_life_value: '', shelf_unit: 'hours', station: 'Partida' }
}

export function NewProductionButton() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
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

  function handleOpen() {
    setForm(emptyForm())
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
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Nova producció</h2>
          <button
            onClick={handleClose}
            disabled={pending}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 disabled:opacity-50 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
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
                  onClick={() => set('shelf_unit', 'hours')}
                  disabled={pending}
                  className={`px-4 text-base font-semibold transition-colors ${form.shelf_unit === 'hours' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Hores
                </button>
                <button
                  type="button"
                  onClick={() => set('shelf_unit', 'days')}
                  disabled={pending}
                  className={`px-4 text-base font-semibold transition-colors ${form.shelf_unit === 'days' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Dies
                </button>
              </div>
            </div>
            {errors.shelf_life_value && <p className="text-sm text-red-600 mt-1.5">{errors.shelf_life_value}</p>}
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
