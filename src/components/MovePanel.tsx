'use client'

import { useState, useTransition } from 'react'
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
  name: string
  unit: string
  station: Station
  initialLots: ActiveLot[]
  expiredLots: ActiveLot[]
  onClose: () => void
  onSuccess?: () => void
}

export function MovePanel({ productionId, name, unit, station, initialLots, expiredLots, onClose, onSuccess }: Props): React.JSX.Element {
  const { showToast } = useToast()
  const lots = [...initialLots, ...expiredLots]
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [targetStation, setTargetStation] = useState<Station | null>(null)
  const [pending, startTransition] = useTransition()

  const availableStations = STATIONS.filter((s) => s !== station)
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

  function handleSubmit(): void {
    if (!targetStation || selected.size === 0) return
    startTransition(async () => {
      const result = await moveLots(productionId, [...selected], targetStation)
      if (result.error) {
        showToast(`Error movent lots: ${result.error}`)
      } else {
        const count = selected.size
        showToast(`${count} lot${count > 1 ? 's' : ''} mogut${count > 1 ? 's' : ''} a ${targetStation}`)
        onSuccess?.()
      }
    })
  }

  const selectedCount = selected.size
  const isFreezing = targetStation === 'Congelador'

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
          const frozen = lot.expires_at === null
          const s = frozen ? null : expirySemaphore(lot.expires_at!)
          const isSelected = selected.has(lot.log_id)
          return (
            <button
              key={lot.log_id}
              onClick={() => toggleLot(lot.log_id)}
              disabled={pending}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border border-l-[3px] transition-colors disabled:opacity-50 ${
                frozen ? 'border-l-blue-400/30' : borderColor[s!]
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
              <span className={`w-2 h-2 rounded-full shrink-0 ${frozen ? 'bg-blue-500' : dotColor[s!]}`} />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Lote</span>
                  <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">#{lot.batch_number}</span>
                </div>
                {frozen
                  ? <div className="text-xs text-blue-600 font-semibold">Congelat</div>
                  : <div className={`text-xs ${textColor[s!]}`}>{formatExpiry(lot.expires_at!)}</div>
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
                const active = targetStation === s
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
        disabled={pending || selectedCount === 0 || !targetStation}
        className="w-full h-14 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        {pending ? 'Movent...' : `Moure ${selectedCount} lot${selectedCount !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
