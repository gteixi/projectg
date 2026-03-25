'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPreparation, updatePreparation, deactivatePreparation } from '@/lib/prep-actions'
import { CollapsibleStation } from '@/components/CollapsibleStation'
import { Preparation, Station } from '@/types/database'

const STATIONS: Station[] = ['Fríos', 'Fuegos', 'Postres', 'Panadería', 'Entrantes']
const UNITS = ['kg', 'L', 'raciones'] as const
type Unit = (typeof UNITS)[number]

type StationTheme = { accentBorder: string; accentText: string; accentBg: string }
const STATION_THEMES: Record<Station, StationTheme> = {
  Fríos: { accentBorder: 'border-l-blue-500', accentText: 'text-blue-700', accentBg: 'bg-blue-50' },
  Fuegos: { accentBorder: 'border-l-orange-500', accentText: 'text-orange-700', accentBg: 'bg-orange-50' },
  Postres: { accentBorder: 'border-l-pink-500', accentText: 'text-pink-700', accentBg: 'bg-pink-50' },
  Panadería: { accentBorder: 'border-l-amber-500', accentText: 'text-amber-700', accentBg: 'bg-amber-50' },
  Entrantes: { accentBorder: 'border-l-teal-500', accentText: 'text-teal-700', accentBg: 'bg-teal-50' },
}

type Mode =
  | { type: 'idle' }
  | { type: 'new' }
  | { type: 'edit'; id: string }
  | { type: 'deactivating'; id: string }

interface FormState {
  name: string
  unit: Unit
  par_quantity: string
  shelf_life_hours: string
  station: Station
}

function emptyForm(defaults?: Partial<FormState>): FormState {
  return { name: '', unit: 'kg', par_quantity: '', shelf_life_hours: '', station: 'Fríos', ...defaults }
}

function prepToForm(p: Preparation): FormState {
  return {
    name: p.name,
    unit: UNITS.includes(p.unit as Unit) ? (p.unit as Unit) : 'kg',
    par_quantity: p.par_quantity.toString(),
    shelf_life_hours: p.shelf_life_hours.toString(),
    station: p.station,
  }
}

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (form.name.trim().length < 2) errors.name = 'Mínim 2 caràcters'
  const qty = parseFloat(form.par_quantity)
  if (isNaN(qty) || qty <= 0) errors.par_quantity = 'Ha de ser major que 0'
  const shelf = parseFloat(form.shelf_life_hours)
  if (isNaN(shelf) || shelf <= 0) errors.shelf_life_hours = 'Ha de ser major que 0'
  return errors
}

function PrepForm({
  initial,
  defaultStation,
  onDone,
  onCancel,
}: {
  initial?: Preparation
  defaultStation?: Station
  onDone: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<FormState>(
    initial ? prepToForm(initial) : emptyForm({ station: defaultStation ?? 'Fríos' })
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }

  function handleSubmit() {
    const e = validate(form)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setServerError(null)
    startTransition(async () => {
      const data = {
        name: form.name.trim(),
        unit: form.unit,
        par_quantity: parseFloat(form.par_quantity),
        shelf_life_hours: parseFloat(form.shelf_life_hours),
        station: form.station,
      }
      const result = initial
        ? await updatePreparation(initial.id, data)
        : await createPreparation(data)
      if (result.error) {
        setServerError(result.error)
      } else {
        router.refresh()
        onDone()
      }
    })
  }

  const inputCls = (field: string) =>
    `h-14 border rounded-xl px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 w-full ${
      errors[field] ? 'border-red-400' : 'border-[#e5e3de]'
    }`
  const selectCls = `h-14 border border-[#e5e3de] rounded-xl px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 w-full`
  const labelCls = 'block text-base font-medium text-gray-600 mb-2'
  const errorCls = 'text-sm text-red-600 mt-1.5'

  return (
    <div className="bg-[#f8f7f4] rounded-xl border border-[#e5e3de] p-4 md:p-5">
      <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-4 md:mb-5">
        {initial ? 'Editar preparació' : 'Nova preparació'}
      </h3>
      <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2 md:mb-5">
        <div className="sm:col-span-2">
          <label className={labelCls}>Nom</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            disabled={pending}
            placeholder="Ex: Vinagreta de mostassa"
            className={inputCls('name')}
            autoFocus={!initial}
          />
          {errors.name && <p className={errorCls}>{errors.name}</p>}
        </div>

        <div>
          <label className={labelCls}>Unitat</label>
          <select value={form.unit} onChange={(e) => set('unit', e.target.value as Unit)} disabled={pending} className={selectCls}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Partida</label>
          <select value={form.station} onChange={(e) => set('station', e.target.value as Station)} disabled={pending} className={selectCls}>
            {STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Quantitat par</label>
          <input
            type="number" min="0.1" step="0.1"
            value={form.par_quantity}
            onChange={(e) => set('par_quantity', e.target.value)}
            disabled={pending}
            placeholder="Ex: 5"
            className={inputCls('par_quantity')}
          />
          {errors.par_quantity && <p className={errorCls}>{errors.par_quantity}</p>}
        </div>

        <div>
          <label className={labelCls}>Caducitat (hores)</label>
          <input
            type="number" min="1" step="1"
            value={form.shelf_life_hours}
            onChange={(e) => set('shelf_life_hours', e.target.value)}
            disabled={pending}
            placeholder="Ex: 24"
            className={inputCls('shelf_life_hours')}
          />
          {errors.shelf_life_hours && <p className={errorCls}>{errors.shelf_life_hours}</p>}
        </div>
      </div>

      {serverError && <p className="text-base text-red-600 mb-4">{serverError}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={pending}
          className="flex-1 h-14 px-6 rounded-xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 disabled:opacity-50 sm:flex-none sm:px-8"
        >
          {pending ? 'Desant…' : initial ? 'Desar canvis' : 'Crear preparació'}
        </button>
        <button
          onClick={onCancel}
          disabled={pending}
          className="flex-1 h-14 px-4 rounded-xl border border-[#e5e3de] text-gray-600 text-base font-medium hover:bg-white disabled:opacity-50 sm:flex-none sm:px-6"
        >
          Cancel·lar
        </button>
      </div>
    </div>
  )
}

export function PrepManager({ preparations }: { preparations: Preparation[] }) {
  const [mode, setMode] = useState<Mode>({ type: 'idle' })
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const reset = () => setMode({ type: 'idle' })

  const grouped = STATIONS.map((station) => ({
    station,
    items: preparations.filter((p) => p.station === station),
  })).filter((g) => g.items.length > 0)

  function handleDeactivate(id: string) {
    startTransition(async () => {
      const result = await deactivatePreparation(id)
      if (!result.error) { router.refresh(); reset() }
    })
  }

  return (
    <div>
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Preparacions</h1>
          <p className="text-base text-gray-500 mt-0.5 md:text-lg">{preparations.length} preparacions actives</p>
        </div>
        <button
          onClick={() => setMode({ type: 'new' })}
          disabled={mode.type === 'new'}
          className="h-14 px-6 rounded-xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <span className="text-xl leading-none">+</span>
          Nova preparació
        </button>
      </div>

      {mode.type === 'new' && (
        <div className="mb-4 md:mb-5">
          <PrepForm onDone={reset} onCancel={reset} />
        </div>
      )}

      {grouped.length === 0 && mode.type !== 'new' && (
        <p className="text-center text-gray-400 text-lg py-16">
          Sense preparacions. Crea la primera amb el botó de dalt.
        </p>
      )}

      <div className="flex flex-col gap-4 md:gap-5">
        {grouped.map(({ station, items }) => {
          const theme = STATION_THEMES[station]
          return (
            <CollapsibleStation
              key={station}
              accentBorder={theme.accentBorder}
              accentBg={theme.accentBg}
              accentText={theme.accentText}
              title={station}
              headerRight={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 text-gray-600 text-sm font-semibold px-3 py-1">
                  {items.length} prep.
                </span>
              }
            >
              {/* Mòbil: cards */}
              <div className="md:hidden divide-y divide-[#e5e3de]">
                {items.map((item) => (
                  <React.Fragment key={item.id}>
                    <div className="p-4">
                      <div className="mb-1">
                        <div className="text-base font-semibold text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {item.unit} · Par: {item.par_quantity} · Cad: {item.shelf_life_hours}h
                        </div>
                      </div>
                      {mode.type === 'deactivating' && mode.id === item.id ? (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-base text-gray-600 shrink-0 mr-1">Desactivar?</span>
                          <button onClick={() => handleDeactivate(item.id)} disabled={pending}
                            className="flex-1 h-14 rounded-xl bg-red-600 text-white text-base font-semibold hover:bg-red-700 disabled:opacity-50">
                            {pending ? '…' : 'Sí'}
                          </button>
                          <button onClick={reset} disabled={pending}
                            className="flex-1 h-14 rounded-xl border border-[#e5e3de] text-gray-600 text-base hover:bg-gray-50 disabled:opacity-50">
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setMode({ type: 'edit', id: item.id })}
                            disabled={mode.type === 'edit' && mode.id === item.id}
                            className="flex-1 h-14 rounded-xl border border-[#e5e3de] text-gray-700 text-base font-medium hover:bg-gray-50 disabled:opacity-50">
                            Edita
                          </button>
                          <button onClick={() => setMode({ type: 'deactivating', id: item.id })}
                            className="flex-1 h-14 rounded-xl border border-red-200 text-red-600 text-base font-medium hover:bg-red-50">
                            Desactiva
                          </button>
                        </div>
                      )}
                    </div>
                    {mode.type === 'edit' && mode.id === item.id && (
                      <div className="px-4 pb-4">
                        <PrepForm initial={item} onDone={reset} onCancel={reset} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Tablet/escriptori: taula */}
              <div className="hidden md:block px-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e3de]">
                      <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Nom</th>
                      <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Unitat</th>
                      <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Par</th>
                      <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Caducitat</th>
                      <th className="py-3 pl-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Accions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className="border-b border-[#e5e3de] last:border-0 hover:bg-[#fafaf8] transition-colors">
                          <td className="py-5 pr-6 align-middle">
                            <span className="text-lg font-semibold text-gray-900 leading-tight">{item.name}</span>
                          </td>
                          <td className="py-5 px-4 align-middle text-right">
                            <span className="text-base tabular-nums text-gray-500">{item.unit}</span>
                          </td>
                          <td className="py-5 px-4 align-middle text-right">
                            <span className="text-xl font-bold tabular-nums text-gray-800">{item.par_quantity}</span>
                            <span className="text-sm text-gray-400 ml-1">{item.unit}</span>
                          </td>
                          <td className="py-5 px-4 align-middle text-right">
                            <span className="text-base tabular-nums text-gray-500">{item.shelf_life_hours}h</span>
                          </td>
                          <td className="py-5 pl-4 align-middle">
                            {mode.type === 'deactivating' && mode.id === item.id ? (
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-base text-gray-600 shrink-0">Desactivar?</span>
                                <button onClick={() => handleDeactivate(item.id)} disabled={pending}
                                  className="h-14 px-5 rounded-xl bg-red-600 text-white text-base font-semibold hover:bg-red-700 disabled:opacity-50 shrink-0">
                                  {pending ? '…' : 'Sí'}
                                </button>
                                <button onClick={reset} disabled={pending}
                                  className="h-14 px-5 rounded-xl border border-[#e5e3de] text-gray-600 text-base hover:bg-gray-50 disabled:opacity-50 shrink-0">
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 justify-end">
                                <button onClick={() => setMode({ type: 'edit', id: item.id })}
                                  disabled={mode.type === 'edit' && mode.id === item.id}
                                  className="h-14 px-5 rounded-xl border border-[#e5e3de] text-gray-700 text-base font-medium hover:bg-gray-50 disabled:opacity-50">
                                  Edita
                                </button>
                                <button onClick={() => setMode({ type: 'deactivating', id: item.id })}
                                  className="h-14 px-5 rounded-xl border border-red-200 text-red-600 text-base font-medium hover:bg-red-50">
                                  Desactiva
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {mode.type === 'edit' && mode.id === item.id && (
                          <tr>
                            <td colSpan={5} className="pb-4 pt-1">
                              <PrepForm initial={item} onDone={reset} onCancel={reset} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleStation>
          )
        })}
      </div>
    </div>
  )
}
