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
        const s = expirySemaphore(lot.expires_at)
        return (
          <li key={lot.log_id} className={`flex items-center justify-between text-sm py-2 px-3 rounded-lg border border-[#e5e3de]/60 border-l-[3px] ${borderColor[s]} bg-white`}>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor[s]}`} />
              <span className="text-gray-500">Lot #{lot.batch_number}</span>
            </span>
            <span className="flex items-baseline gap-4">
              <span className={`${textColor[s]}`}>{formatExpiry(lot.expires_at)}</span>
              <span className="font-semibold text-gray-800 tabular-nums min-w-[4rem] text-right">{lot.quantity} {truncUnit(unit)}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
