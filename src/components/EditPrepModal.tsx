'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updatePreparation, deactivatePreparation } from '@/lib/prep-actions'
import { suggestShelfLife } from '@/lib/ai-actions'
import { type Station, type StockActualHoy } from '@/types/database'
import { STATIONS, UNITS, type Unit, MIN_PREP_NAME_LENGTH } from '@/lib/constants'

interface Props {
  item: StockActualHoy
  onClose: () => void
}

export function EditPrepModal({ item, onClose }: Props): React.JSX.Element {
  const [name, setName] = useState(item.name)
  const [unit, setUnit] = useState<Unit>(item.unit as Unit)
  const [shelfLifeHours, setShelfLifeHours] = useState(item.shelf_life_hours?.toString() ?? '')
  const [station, setStation] = useState<Station>(item.station)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSuggest(): Promise<void> {
    if (name.trim().length < 2) return
    setSuggesting(true)
    setSuggestionReason(null)
    const result = await suggestShelfLife(name)
    setSuggesting(false)
    if (result.suggestion) {
      if (result.suggestion.hours !== null) {
        setShelfLifeHours(String(result.suggestion.hours))
      }
      setSuggestionReason(result.suggestion.reasoning)
    } else if (result.error) {
      setServerError(result.error)
    }
  }

  function handleClose(): void {
    if (pending) return
    onClose()
  }

  function handleSave(): void {
    const errs: Record<string, string> = {}
    if (name.trim().length < MIN_PREP_NAME_LENGTH) errs.name = `Mínim ${MIN_PREP_NAME_LENGTH} caràcters`
    if (shelfLifeHours !== '') {
      const shelf = parseFloat(shelfLifeHours)
      if (isNaN(shelf) || shelf <= 0) errs.shelf_life_hours = 'Ha de ser major que 0'
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setServerError(null)
    startTransition(async () => {
      const result = await updatePreparation(item.production_id, {
        name: name.trim(),
        unit,
        shelf_life_hours: shelfLifeHours !== '' ? parseFloat(shelfLifeHours) : null,
        station,
      })
      if (result.error) {
        setServerError(result.error)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  function handleDeactivate(): void {
    setServerError(null)
    startTransition(async () => {
      const result = await deactivatePreparation(item.production_id)
      if (result.error) {
        setServerError(result.error)
        setConfirmDeactivate(false)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  function clearError(field: string): void {
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e })
  }

  const inputCls = (field: string): string =>
    `h-14 border rounded-xl px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 w-full ${
      errors[field] ? 'border-red-400' : 'border-[#e5e3de]'
    }`
  const selectCls = 'h-14 border border-[#e5e3de] rounded-xl px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 w-full'
  const labelCls = 'block text-base font-medium text-gray-600 mb-2'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Editar producció</h2>
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
              value={name}
              onChange={(e) => { setName(e.target.value); clearError('name') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleClose() }}
              disabled={pending}
              className={inputCls('name')}
              autoFocus
            />
            {errors.name && <p className="text-sm text-red-600 mt-1.5">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Unitat</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} disabled={pending} className={selectCls}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Secció</label>
              <select value={station} onChange={(e) => setStation(e.target.value as Station)} disabled={pending} className={selectCls}>
                {STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-base font-medium text-gray-600">Caducitat (hores) <span className="text-gray-400 font-normal">— opcional</span></label>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={pending || suggesting || name.trim().length < 2}
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
            <input
              type="number" min="1" step="1"
              value={shelfLifeHours}
              onChange={(e) => { setShelfLifeHours(e.target.value); clearError('shelf_life_hours') }}
              disabled={pending}
              placeholder="Ex: 24"
              className={inputCls('shelf_life_hours')}
            />
            {errors.shelf_life_hours && <p className="text-sm text-red-600 mt-1.5">{errors.shelf_life_hours}</p>}
          </div>

          {serverError && <p className="text-base text-red-600">{serverError}</p>}
        </div>

        <div className="px-6 pb-4 pt-2 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={pending}
              className="flex-1 h-14 rounded-xl bg-gray-100 text-gray-700 text-base font-semibold hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel·lar
            </button>
            <button
              onClick={handleSave}
              disabled={pending}
              className="flex-1 h-14 rounded-xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              {pending ? 'Desant…' : 'Desar'}
            </button>
          </div>

          {!confirmDeactivate ? (
            <button
              onClick={() => setConfirmDeactivate(true)}
              disabled={pending}
              className="w-full h-12 rounded-xl text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Desactivar producció
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeactivate(false)}
                disabled={pending}
                className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                No
              </button>
              <button
                onClick={handleDeactivate}
                disabled={pending}
                className="flex-1 h-12 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? 'Desactivant…' : 'Sí, desactivar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
