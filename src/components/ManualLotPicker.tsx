'use client'

import { type ActiveLot } from '@/types/database'
import { truncUnit, formatExpiryShort } from '@/lib/format'
import { FIFO_TOLERANCE, FIFO_ROUNDING_FACTOR } from '@/lib/constants'

interface Props {
  lots: ActiveLot[]
  unit: string
  quantity: string
  manualQty: Record<number, string>
  onManualQtyChange: (batchNumber: number, value: string) => void
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

  return (
    <div className="flex flex-col gap-1.5">
      {lots.map((lot) => {
        const taken = parseFloat(manualQty[lot.batch_number] ?? '0') || 0
        return (
          <div key={lot.batch_number} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-[#e5e3de]">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-mono font-semibold text-gray-800">#{lot.batch_number}</span>
              <span className="text-xs text-gray-400 ml-2">cad. {formatExpiryShort(lot.expires_at)}</span>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{lot.quantity} {truncUnit(unit)}</span>
            <input
              type="number"
              min="0"
              max={lot.quantity}
              step="0.1"
              value={manualQty[lot.batch_number] ?? '0'}
              onChange={(e) => onManualQtyChange(lot.batch_number, e.target.value)}
              disabled={pending}
              className={`w-20 h-10 text-right text-base border rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 bg-white shrink-0 ${
                taken > lot.quantity ? 'border-red-400' : 'border-red-300'
              }`}
            />
          </div>
        )
      })}
      {requested > 0 && (
        <div className={`text-xs text-right font-semibold px-1 ${Math.abs(diff) < FIFO_TOLERANCE ? 'text-green-600' : 'text-red-600'}`}>
          Total: {Math.round(manualTotal * FIFO_ROUNDING_FACTOR) / FIFO_ROUNDING_FACTOR} / {requested} {truncUnit(unit)}
          {Math.abs(diff) >= FIFO_TOLERANCE && ` (${diff > 0 ? '+' : ''}${diff})`}
        </div>
      )}
    </div>
  )
}
