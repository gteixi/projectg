'use client'

import { useState } from 'react'
import { ProductionButton } from './ProductionButton'
import { SalePanel } from './SalePanel'
import { EditPrepModal } from './EditPrepModal'
import { type StockActualHoy, type ActiveLot } from '@/types/database'
import { truncUnit } from '@/lib/format'
import { ShelfLifeInfo } from '@/components/ShelfLifeInfo'
import { LotList } from '@/components/LotList'

type OpenMode = 'production' | 'sale' | null

export function PrepCard({ item, initialLots, openMode, onSetMode, onStockDelta }: {
  item: StockActualHoy
  initialLots: ActiveLot[]
  openMode: OpenMode
  onSetMode: (mode: OpenMode) => void
  onStockDelta: (delta: number) => void
}): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const [showLots, setShowLots] = useState(false)

  return (
    <div className="px-4 py-5 border-b border-[#e5e3de] last:border-0">
      {editing && <EditPrepModal item={item} onClose={() => setEditing(false)} />}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-lg font-semibold text-gray-900 leading-tight">{item.name}</span>
          {item.shelf_life_hours != null && <ShelfLifeInfo hours={item.shelf_life_hours} onEdit={() => setEditing(true)} />}
        </div>
      </div>
      <div className="mb-4">
        {item.stock_total > 0 ? (
          <>
            <button
              onClick={() => setShowLots(!showLots)}
              className="text-base text-gray-500 flex items-center gap-1.5 active:opacity-70"
            >
              Stock: <strong className="text-gray-800 tabular-nums underline decoration-dotted decoration-gray-300 underline-offset-4">{item.stock_total} {truncUnit(item.unit)}</strong>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`text-gray-400 transition-transform ${showLots ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {showLots && (
              <div className="mt-2">
                <LotList lots={initialLots} unit={item.unit} />
              </div>
            )}
          </>
        ) : (
          <span className="text-base text-gray-400">
            Stock: <strong className="tabular-nums">0 {truncUnit(item.unit)}</strong>
          </span>
        )}
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
            disabled={item.stock_total <= 0}
            className={`flex-1 h-14 rounded-xl border text-base font-semibold transition-colors ${
              item.stock_total <= 0
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-red-600 text-red-600 hover:bg-red-50'
            }`}
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
            onManualMode={(on) => { if (on) setShowLots(false) }}
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
