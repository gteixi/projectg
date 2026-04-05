'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { moveLots } from '@/lib/move-actions'
import { type ActiveLot, type Station } from '@/types/database'
import { truncUnit, formatExpiry, expirySemaphore, type ExpirySemaphore } from '@/lib/format'
import { useToast } from '@/components/Toast'
import { STATIONS } from '@/lib/constants'

const dotColor: Record<ExpirySemaphore, string> = {
  green: 'bg-[#16a34a]',
  yellow: 'bg-[#ca8a04]',
  red: 'bg-[#dc2626]',
}

const borderColor: Record<ExpirySemaphore, string> = {
  green: 'border-l-[#16a34a]/30',
  yellow: 'border-l-[#ca8a04]/30',
  red: 'border-l-[#dc2626]/30',
}

const textColor: Record<ExpirySemaphore, string> = {
  green: 'text-[#16a34a]',
  yellow: 'text-[#ca8a04]',
  red: 'text-[#dc2626]',
}

const STATION_COLORS: Record<Station, { bg: string; border: string; text: string; activeBg: string }> = {
  Partida:    { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', activeBg: 'bg-orange-600' },
  Congelador: { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-700',   activeBg: 'bg-blue-600' },
  Camara:     { bg: 'bg-teal-50',   border: 'border-teal-300',   text: 'text-teal-700',   activeBg: 'bg-teal-600' },
  Timbre:     { bg: 'bg-pink-50',   border: 'border-pink-300',   text: 'text-pink-700',   activeBg: 'bg-pink-600' },
}

interface Props {
  productionId: string
  unit: string
  station: Station
  shelfLifeHours: number | null
  initialLots: ActiveLot[]
  expiredLots: ActiveLot[]
  onSuccess?: () => void
}

const EXPIRY_PRESETS = [
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '72h', hours: 72 },
]

type ShelfUnit = 'hours' | 'days'

export function MovePanel({ productionId, unit, station, shelfLifeHours, initialLots, expiredLots, onSuccess }: Props): React.JSX.Element {
  const router = useRouter()
  const { showToast } = useToast()
  const lots = [...initialLots, ...expiredLots]
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [targetStation, setTargetStation] = useState<Station | null>(null)
  const [pending, startTransition] = useTransition()
  const [showExpiryPrompt, setShowExpiryPrompt] = useState(false)
  const [expiryValue, setExpiryValue] = useState('')
  const [expiryUnit, setExpiryUnit] = useState<ShelfUnit>('hours')

  const selectedLots = lots.filter((l) => selected.has(l.log_id))
  const effectiveStations = new Set(selectedLots.length > 0
    ? selectedLots.map((l) => l.current_station ?? station)
    : [station])
  const availableStations = STATIONS.filter((s) => !effectiveStations.has(s))
  const validTarget = targetStation && availableStations.includes(targetStation) ? targetStation : null
  const unitLabel = truncUnit(unit)

  function toggleLot(logId: string): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(logId)) next.delete(logId)
      else next.add(logId)
      return next
    })
  }

  function toggleAll(): void {
    if (selected.size === lots.length) setSelected(new Set())
    else setSelected(new Set(lots.map((l) => l.log_id)))
  }

  function needsExpiryPrompt(): boolean {
    if (!validTarget || validTarget === 'Congelador') return false
    if (shelfLifeHours) return false
    const selectedList = lots.filter((l) => selected.has(l.log_id))
    return selectedList.some((l) => {
      const eff = l.current_station ?? station
      return eff === 'Congelador' && l.expires_at === null
    })
  }

  function handleSubmit(): void {
    if (!validTarget || selected.size === 0) return
    if (needsExpiryPrompt()) {
      setShowExpiryPrompt(true)
      return
    }
    doMove()
  }

  function doMove(expiryHours?: number): void {
    if (!validTarget) return
    startTransition(async () => {
      const result = await moveLots(productionId, [...selected], validTarget, expiryHours)
      if (result.error) {
        showToast(`Error movent lots: ${result.error}`)
      } else {
        setShowExpiryPrompt(false)
        onSuccess?.()
        router.refresh()
      }
    })
  }

  const selectedCount = selected.size
  const isFreezing = validTarget === 'Congelador'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Selecciona lots</span>
        {lots.length > 1 && (
          <button
            onClick={toggleAll}
            className="text-sm text-blue-600 font-semibold active:opacity-70"
          >
            {selected.size === lots.length ? 'Deseleccionar tot' : 'Seleccionar tot'}
          </button>
        )}
      </div>

      {lots.length === 0 && (
        <span className="text-sm text-gray-400">Cap lot actiu per moure</span>
      )}

      <div className="flex flex-col gap-1.5">
        {lots.map((lot) => {
          const frozen = (lot.current_station ?? station) === 'Congelador'
          const hasExpiry = !frozen && lot.expires_at != null
          const s = hasExpiry ? expirySemaphore(lot.expires_at!) : null
          const isSelected = selected.has(lot.log_id)
          return (
            <button
              key={lot.log_id}
              onClick={() => toggleLot(lot.log_id)}
              disabled={pending}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border border-l-[3px] transition-colors disabled:opacity-50 ${
                frozen ? 'border-l-blue-400/30' : s ? borderColor[s] : 'border-l-gray-300/30'
              } ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-[#e5e3de]/60'}`}
            >
              <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
              }`}>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${frozen ? 'bg-blue-500' : s ? dotColor[s] : 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Lote</span>
                  <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">#{lot.batch_number}</span>
                </div>
                {frozen
                  ? <div className="text-xs text-blue-600 font-semibold">Congelat</div>
                  : hasExpiry
                    ? <div className={`text-xs ${textColor[s!]}`}>{formatExpiry(lot.expires_at!)}</div>
                    : <div className="text-xs text-gray-400">Sense caducitat</div>
                }
              </div>
              <span className="text-sm font-semibold text-gray-800 tabular-nums shrink-0">{lot.quantity} {unitLabel}</span>
            </button>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Destí</span>
            <div className="flex gap-2">
              {availableStations.map((s) => {
                const colors = STATION_COLORS[s]
                const active = validTarget === s
                return (
                  <button
                    key={s}
                    onClick={() => setTargetStation(s)}
                    disabled={pending}
                    className={`flex-1 h-14 rounded-xl text-base font-semibold border transition-colors disabled:opacity-50 ${
                      active
                        ? `${colors.activeBg} border-transparent text-white`
                        : `${colors.bg} ${colors.border} ${colors.text}`
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {isFreezing && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-sm text-blue-700">La caducitat es pausarà (congelat)</span>
            </div>
          )}
        </>
      )}

      <button
        onClick={handleSubmit}
        disabled={pending || selectedCount === 0 || !validTarget}
        className="w-full h-14 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        {pending ? 'Movent...' : `Moure ${selectedCount} lot${selectedCount !== 1 ? 's' : ''}`}
      </button>

      {showExpiryPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-[90vw] max-w-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Caducitat al descongelar</h3>
              <button onClick={() => setShowExpiryPrompt(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <p className="text-sm text-gray-500">Aquesta producció no té vida útil definida. Quanta caducitat vols assignar?</p>
            <div className="flex gap-2">
              {EXPIRY_PRESETS.map((p) => (
                <button
                  key={p.hours}
                  onClick={() => doMove(p.hours)}
                  disabled={pending}
                  className="flex-1 h-12 rounded-xl bg-gray-100 text-base font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#e5e3de]" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">o personalitzar</span>
              <div className="flex-1 h-px bg-[#e5e3de]" />
            </div>
            <div className="flex h-12 rounded-xl border border-[#e5e3de] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  if (expiryUnit === 'days') {
                    const raw = parseFloat(expiryValue)
                    if (!isNaN(raw) && raw > 0) {
                      const converted = raw * 24
                      setExpiryValue(Number.isInteger(converted) ? String(converted) : converted.toFixed(1))
                    }
                    setExpiryUnit('hours')
                  }
                }}
                disabled={pending}
                className={`flex-1 text-base font-semibold transition-colors ${expiryUnit === 'hours' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                Hores
              </button>
              <button
                type="button"
                onClick={() => {
                  if (expiryUnit === 'hours') {
                    const raw = parseFloat(expiryValue)
                    if (!isNaN(raw) && raw > 0) {
                      const converted = raw / 24
                      setExpiryValue(Number.isInteger(converted) ? String(converted) : converted.toFixed(1))
                    }
                    setExpiryUnit('days')
                  }
                }}
                disabled={pending}
                className={`flex-1 text-base font-semibold transition-colors ${expiryUnit === 'days' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                Dies
              </button>
            </div>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={expiryValue}
              onChange={(e) => setExpiryValue(e.target.value)}
              placeholder={expiryUnit === 'days' ? 'Ex: 3' : 'Ex: 24'}
              className="w-full h-14 rounded-xl border border-[#e5e3de] px-4 text-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => {
                const raw = parseFloat(expiryValue)
                if (!isNaN(raw) && raw > 0) {
                  const hours = expiryUnit === 'days' ? raw * 24 : raw
                  doMove(hours)
                }
              }}
              disabled={pending || !expiryValue || parseFloat(expiryValue) <= 0}
              className="w-full h-14 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
