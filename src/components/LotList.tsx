'use client'

import { type ActiveLot, type Station } from '@/types/database'
import { formatExpiry, truncUnit, expirySemaphore, type ExpirySemaphore } from '@/lib/format'

const STATION_BADGE: Record<Station, { bg: string; text: string }> = {
  Partida:    { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  Congelador: { bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700' },
  Camara:     { bg: 'bg-teal-50 border-teal-200',     text: 'text-teal-700' },
  Timbre:     { bg: 'bg-pink-50 border-pink-200',     text: 'text-pink-700' },
}

const textColor: Record<ExpirySemaphore, string> = {
  green: 'text-[#16a34a]',
  yellow: 'text-[#ca8a04]',
  red: 'text-[#dc2626]',
}

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

export function LotList({ lots, unit }: { lots: ActiveLot[]; unit: string }): React.JSX.Element {
  if (lots.length === 0) {
    return <p className="text-sm text-gray-400 italic py-2">Sense lots actius</p>
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {lots.map((lot) => {
        const frozen = lot.expires_at === null
        const s = frozen ? null : expirySemaphore(lot.expires_at!)
        return (
          <li key={lot.log_id} className={`grid grid-cols-[1fr_auto] items-center text-sm py-2 px-3 rounded-lg border border-[#e5e3de]/60 border-l-[3px] ${frozen ? 'border-l-blue-400/30' : borderColor[s!]} bg-white`}>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${frozen ? 'bg-blue-500' : dotColor[s!]}`} />
              <span className="text-xs text-gray-500">Lote</span>
              <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">#{lot.batch_number}</span>
            </span>
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-semibold text-gray-800 tabular-nums">{lot.quantity} {truncUnit(unit)}</span>
              {lot.current_station && (() => {
                const badge = STATION_BADGE[lot.current_station]
                return (
                  <span className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 ${badge.bg} ${badge.text}`}>
                    {lot.current_station}
                  </span>
                )
              })()}
              {frozen
                ? <span className="text-xs text-blue-600 font-semibold">Congelat</span>
                : <span className={`text-xs ${textColor[s!]}`}>{formatExpiry(lot.expires_at!)}</span>
              }
            </div>
          </li>
        )
      })}
    </ul>
  )
}
