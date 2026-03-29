'use client'

import { useState } from 'react'
import { ProductionButton } from './ProductionButton'
import { SalePanel } from './SalePanel'
import { EditPrepModal } from './EditPrepModal'
import { type StockActualHoy, type ActiveLot } from '@/types/database'
import { truncUnit, formatExpiry } from '@/lib/format'

type OpenMode = 'production' | 'sale' | null

export function PrepCard({ item, initialLots, openMode, onSetMode, onStockDelta }: {
  item: StockActualHoy
  initialLots: ActiveLot[]
  openMode: OpenMode
  onSetMode: (mode: OpenMode) => void
  onStockDelta: (delta: number) => void
}): React.JSX.Element {
  const [editing, setEditing] = useState(false)

  return (
    <div className="p-4 border-b border-[#e5e3de] last:border-0">
      {editing && <EditPrepModal item={item} onClose={() => setEditing(false)} />}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-base font-semibold text-gray-900 leading-tight">{item.name}</div>
          {item.next_expiry && (
            <div className="text-sm font-semibold text-red-600 tabular-nums leading-tight">
              {formatExpiry(item.next_expiry)}
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
      </div>
      <div className="text-sm text-gray-500 mb-3">
        Stock: <strong className="text-gray-800 tabular-nums">{item.stock_total} {truncUnit(item.unit)}</strong>
      </div>

      {openMode === null && (
        <div className="flex gap-2">
          <button
            onClick={() => onSetMode('production')}
            className="flex-1 h-14 rounded-xl border border-blue-600 text-blue-600 text-base font-semibold hover:bg-blue-50 transition-colors"
          >
            + Produir
          </button>
          <button
            onClick={() => onSetMode('sale')}
            className="flex-1 h-14 rounded-xl border border-red-600 text-red-600 text-base font-semibold hover:bg-red-50 transition-colors"
          >
            - Sale
          </button>
        </div>
      )}

      {openMode === 'production' && (
        <div className="flex flex-col gap-2">
          <ProductionButton
            productionId={item.production_id}
            name={item.name}
            unit={item.unit}
            shelfLifeHours={item.shelf_life_hours}
            variant="form"
            onClose={() => onSetMode(null)}
            onSuccess={(qty) => onStockDelta(qty)}
          />
          <button
            onClick={() => onSetMode(null)}
            className="h-14 rounded-xl bg-gray-100 text-gray-700 text-base font-semibold hover:bg-gray-200"
          >
            Anul·lar
          </button>
        </div>
      )}

      {openMode === 'sale' && (
        <div className="flex flex-col gap-2">
          <SalePanel
            productionId={item.production_id}
            unit={item.unit}
            stock={item.stock_total}
            initialLots={initialLots}
            onClose={() => onSetMode(null)}
            onSuccess={(qty) => onStockDelta(-qty)}
          />
          <button
            onClick={() => onSetMode(null)}
            className="h-14 rounded-xl bg-gray-100 text-gray-700 text-base font-semibold hover:bg-gray-200"
          >
            Anul·lar
          </button>
        </div>
      )}
    </div>
  )
}
