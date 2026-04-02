'use client'

import { type ActiveLot } from '@/types/database'
import { formatExpiry, truncUnit, expirySemaphore, type ExpirySemaphore } from '@/lib/format'

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
        const frozen = lot.current_station === 'Congelador'
        const hasExpiry = !frozen && lot.expires_at != null
        const s = hasExpiry ? expirySemaphore(lot.expires_at!) : null
        return (
          <li key={lot.log_id} className={`grid grid-cols-[1fr_auto] items-center text-sm py-2 px-3 rounded-lg border border-[#e5e3de]/60 border-l-[3px] ${frozen ? 'border-l-blue-400/30' : s ? borderColor[s] : 'border-l-gray-300/30'} bg-white`}>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${frozen ? 'bg-blue-500' : s ? dotColor[s] : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500">Lote</span>
              <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">#{lot.batch_number}</span>
            </span>
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-semibold text-gray-800 tabular-nums">{lot.quantity} {truncUnit(unit)}</span>
              {frozen
                ? <span className="text-xs text-blue-600 font-semibold">Congelat</span>
                : hasExpiry
                  ? <span className={`text-xs ${textColor[s!]}`}>{formatExpiry(lot.expires_at!)}</span>
                  : <span className="text-xs text-gray-400">Sense caducitat</span>
              }
            </div>
          </li>
        )
      })}
    </ul>
  )
}
