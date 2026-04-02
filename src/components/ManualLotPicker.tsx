'use client'

import { type ActiveLot } from '@/types/database'
import { truncUnit, formatExpiry, expirySemaphore, type ExpirySemaphore } from '@/lib/format'
import { FIFO_TOLERANCE, FIFO_ROUNDING_FACTOR } from '@/lib/constants'

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

interface Props {
  lots: ActiveLot[]
  unit: string
  quantity: string
  manualQty: Record<string, string>
  onManualQtyChange: (batchNumber: string, value: string) => void
  pending: boolean
}

export function ManualLotPicker({
  lots,
  unit,
  quantity,
  manualQty,
  onManualQtyChange,
  pending,
}: Props): React.JSX.Element {
  const manualTotal = lots.reduce(
    (s, lot) => s + (parseFloat(manualQty[lot.batch_number] ?? '0') || 0),
    0,
  )
  const requested = parseFloat(quantity) || 0
  const diff = Math.round((manualTotal - requested) * FIFO_ROUNDING_FACTOR) / FIFO_ROUNDING_FACTOR
  const unitLabel = truncUnit(unit)

  return (
    <div className="flex flex-col gap-1.5">
      {lots.map((lot) => {
        const frozen = lot.expires_at === null
        const s = frozen ? null : expirySemaphore(lot.expires_at!)
        const taken = parseFloat(manualQty[lot.batch_number] ?? '0') || 0
        return (
          <div key={lot.batch_number} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border border-[#e5e3de]/60 border-l-[3px] ${frozen ? 'border-l-blue-400/30' : borderColor[s!]} bg-white`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${frozen ? 'bg-blue-500' : dotColor[s!]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1"><span className="text-xs text-gray-500">Lote</span><span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">#{lot.batch_number}</span></div>
              {frozen
                ? <div className="text-xs text-blue-600 font-semibold">Congelat</div>
                : <div className={`text-xs ${textColor[s!]}`}>{formatExpiry(lot.expires_at!)}</div>
              }
            </div>
            <span className="text-xs text-gray-400 tabular-nums shrink-0">{lot.quantity} {unitLabel}</span>
            <input
              type="number"
              min="0"
              max={lot.quantity}
              step="0.1"
              value={manualQty[lot.batch_number] ?? '0'}
              onChange={(e) => onManualQtyChange(lot.batch_number, e.target.value)}
              disabled={pending}
              className={`w-20 h-12 text-left text-base font-semibold border rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 bg-white shrink-0 ${
                taken > lot.quantity ? 'border-red-400' : 'border-red-300'
              }`}
            />
          </div>
        )
      })}
      {requested > 0 && (() => {
        const ok = Math.abs(diff) < FIFO_TOLERANCE
        const rounded = Math.round(manualTotal * FIFO_ROUNDING_FACTOR) / FIFO_ROUNDING_FACTOR
        return (
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl mt-1 ${ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <span className={`text-sm font-semibold ${ok ? 'text-green-700' : 'text-red-700'}`}>
              {ok ? 'Quantitat correcta' : 'No quadra'}
            </span>
            <span className={`text-base font-bold tabular-nums ${ok ? 'text-green-700' : 'text-red-700'}`}>
              {rounded} / {requested} {unitLabel}
            </span>
          </div>
        )
      })()}
    </div>
  )
}
