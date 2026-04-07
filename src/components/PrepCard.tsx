'use client'

import { useState } from 'react'
import { ProductionButton } from './ProductionButton'
import { SalePanel } from './SalePanel'
import { MovePanel } from './MovePanel'
import { EditPrepModal } from './EditPrepModal'
import { type StockActualHoy, type ActiveLot } from '@/types/database'
import { truncUnit } from '@/lib/format'
import { ShelfLifeInfo } from '@/components/ShelfLifeInfo'
import { RecipePanel } from '@/components/RecipePanel'
import { LotList } from '@/components/LotList'

type OpenMode = 'production' | 'sale' | 'move' | null

export function PrepCard({ item, initialLots, expiredLots, openMode, onSetMode, onStockDelta }: {
  item: StockActualHoy
  initialLots: ActiveLot[]
  expiredLots: ActiveLot[]
  openMode: OpenMode
  onSetMode: (mode: OpenMode) => void
  onStockDelta: (delta: number) => void
}): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const [showLots, setShowLots] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="px-4 py-5 border-b border-[#e5e3de] last:border-0">
      {editing && <EditPrepModal item={item} onClose={() => { setEditing(false); setShowInfo(false) }} />}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-lg font-semibold text-gray-900 leading-tight truncate max-w-[260px] inline-block align-middle" title={item.name}>{item.name}</span>
        <ShelfLifeInfo hours={item.shelf_life_hours} open={showInfo} onToggle={setShowInfo} onEdit={() => setEditing(true)} align="right" />
      </div>
      {showInfo && (
        <div className="mb-4 p-3 rounded-lg bg-[#fafaf8]">
          <RecipePanel productionId={item.production_id} />
        </div>
      )}
      <div className="mb-4">
        {(() => {
          const expiredStock = expiredLots.reduce((sum, l) => sum + l.quantity, 0)
          const hasAny = item.stock_total > 0 || expiredStock > 0
          if (!hasAny) {
            return (
              <span className="text-base text-gray-400">
                Stock: <strong className="tabular-nums">0 {truncUnit(item.unit)}</strong>
              </span>
            )
          }
          return (
            <>
              <div className="min-h-[48px] flex items-center gap-2">
                <button
                  onClick={() => setShowLots(!showLots)}
                  className="text-base text-gray-500 flex items-center gap-1.5 active:opacity-70"
                >
                  Stock:
                  <strong className={`tabular-nums underline decoration-dotted underline-offset-4 ${item.stock_total > 0 ? 'text-gray-800 decoration-gray-300' : 'text-gray-300 decoration-gray-200'}`}>
                    {item.stock_total} {truncUnit(item.unit)}
                  </strong>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-gray-400 transition-transform ${showLots ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {expiredStock > 0 && (
                  <span className="text-sm font-semibold text-[#dc2626]">
                    +{expiredStock} caducat
                  </span>
                )}
              </div>
              {showLots && (
                <div className="mt-2">
                  <LotList lots={[...initialLots, ...expiredLots]} unit={item.unit} />
                </div>
              )}
            </>
          )
        })()}
      </div>

      {openMode === null && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSetMode('production')}
            className="w-full h-14 rounded-xl border border-green-600 text-green-600 text-base font-semibold hover:bg-green-50 transition-colors"
          >
            + Produir
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onSetMode('sale')}
              disabled={item.stock_total <= 0 && expiredLots.length === 0}
              className={`flex-1 h-14 rounded-xl border text-base font-semibold transition-colors ${
                item.stock_total <= 0 && expiredLots.length === 0
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-red-600 text-red-600 hover:bg-red-50'
              }`}
            >
              - Surt
            </button>
            <button
              onClick={() => { setShowLots(false); onSetMode('move') }}
              disabled={item.stock_total <= 0 && expiredLots.length === 0}
              className={`flex-1 h-14 rounded-xl border text-base font-semibold transition-colors ${
                item.stock_total <= 0 && expiredLots.length === 0
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              Moure
            </button>
          </div>
        </div>
      )}

      {openMode === 'production' && (
        <div className="flex flex-col gap-2">
          <ProductionButton
            productionId={item.production_id}
            name={item.name}
            unit={item.unit}
            shelfLifeHours={item.shelf_life_hours}
            station={item.station}
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
            name={item.name}
            unit={item.unit}
            stock={item.stock_total}
            initialLots={initialLots}
            expiredLots={expiredLots}
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

      {openMode === 'move' && (
        <div className="flex flex-col gap-2">
          <MovePanel
            productionId={item.production_id}
            unit={item.unit}
            station={item.station}
            shelfLifeHours={item.shelf_life_hours}
            initialLots={initialLots}
            expiredLots={expiredLots}
            onSuccess={() => onSetMode(null)}
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
