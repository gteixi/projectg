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

export function PrepRow({ item, initialLots, expiredLots, openMode, onSetMode, onStockDelta }: {
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

  function toggle(mode: 'production' | 'sale' | 'move'): void {
    onSetMode(openMode === mode ? null : mode)
  }

  return (
    <>
      {editing && <EditPrepModal item={item} onClose={() => { setEditing(false); setShowInfo(false) }} />}
      <tr className="border-b border-[#e5e3de] transition-colors hover:bg-[#fafaf8]">
        <td className="py-5 pr-6 align-middle">
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-lg font-semibold text-gray-900 leading-tight">{item.name}</span>
              <ShelfLifeInfo hours={item.shelf_life_hours} open={showInfo} onToggle={setShowInfo} onEdit={() => setEditing(true)} />
            </div>
          </div>
        </td>
        <td className="py-5 px-4 align-middle text-right">
          {(() => {
            const expiredStock = expiredLots.reduce((sum, l) => sum + l.quantity, 0)
            const hasAny = item.stock_total > 0 || expiredStock > 0
            if (!hasAny) {
              return (
                <span>
                  <span className="text-xl font-bold tabular-nums text-gray-300">0</span>
                  <span className="text-sm text-gray-300 ml-1 max-w-[3rem] truncate">{truncUnit(item.unit)}</span>
                </span>
              )
            }
            return (
              <div className="inline-flex flex-col items-end gap-1">
                <button
                  onClick={() => setShowLots(!showLots)}
                  className="inline-flex items-baseline gap-1.5 active:opacity-70"
                >
                  <span className={`text-xl font-bold tabular-nums underline decoration-dotted underline-offset-4 ${item.stock_total > 0 ? 'text-gray-800 decoration-gray-300' : 'text-gray-300 decoration-gray-200'}`}>
                    {item.stock_total}
                  </span>
                  <span className="text-sm text-gray-400 max-w-[3rem] truncate">{truncUnit(item.unit)}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-gray-400 transition-transform self-center ${showLots ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {expiredStock > 0 && (
                  <span className="text-xs font-semibold text-[#dc2626]">
                    +{expiredStock} {truncUnit(item.unit)} caducat
                  </span>
                )}
              </div>
            )
          })()}
        </td>
        <td className="py-5 pl-3 align-middle w-[380px]">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => toggle('production')}
              className={`h-14 px-4 rounded-xl border text-base font-semibold transition-colors ${
                openMode === 'production'
                  ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                  : 'border-green-600 text-green-600 hover:bg-green-50'
              }`}
            >
              {openMode === 'production' ? 'Anul\u00b7lar' : '+ Produir'}
            </button>
            <button
              onClick={() => toggle('sale')}
              disabled={item.stock_total <= 0 && expiredLots.length === 0}
              className={`h-14 px-4 rounded-xl border text-base font-semibold transition-colors ${
                item.stock_total <= 0 && expiredLots.length === 0
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : openMode === 'sale'
                    ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                    : 'border-red-600 text-red-600 hover:bg-red-50'
              }`}
            >
              {openMode === 'sale' ? 'Anul\u00b7lar' : '- Surt'}
            </button>
            <button
              onClick={() => toggle('move')}
              disabled={item.stock_total <= 0 && expiredLots.length === 0}
              className={`h-14 px-4 rounded-xl border text-base font-semibold transition-colors ${
                item.stock_total <= 0 && expiredLots.length === 0
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : openMode === 'move'
                    ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                    : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {openMode === 'move' ? 'Anul\u00b7lar' : 'Moure'}
            </button>
          </div>
        </td>
      </tr>
      {showLots && (
        <tr className="border-b border-[#e5e3de]">
          <td colSpan={3} className="px-6 py-3 bg-[#fafaf8]">
            <LotList lots={[...initialLots, ...expiredLots]} unit={item.unit} />
          </td>
        </tr>
      )}
      {showInfo && (
        <tr className="border-b border-[#e5e3de]">
          <td colSpan={3} className="px-6 py-4 bg-[#fafaf8]">
            <RecipePanel productionId={item.production_id} kitchenUserId={item.kitchen_user_id} />
          </td>
        </tr>
      )}
      {openMode && (
        <tr className={`border-b border-[#e5e3de] last:border-0 ${openMode === 'sale' ? 'bg-red-50/50' : openMode === 'move' ? 'bg-blue-50/30' : 'bg-green-50/50'}`}>
          <td colSpan={3} className="px-6 py-4">
            {openMode === 'sale' ? (
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
            ) : openMode === 'move' ? (
              <MovePanel
                productionId={item.production_id}
                unit={item.unit}
                station={item.station}
                shelfLifeHours={item.shelf_life_hours}
                initialLots={initialLots}
                expiredLots={expiredLots}
                onSuccess={() => onSetMode(null)}
              />
            ) : (
              <ProductionButton
                productionId={item.production_id}
                name={item.name}
                unit={item.unit}
                shelfLifeHours={item.shelf_life_hours}
                variant="form"
                onClose={() => onSetMode(null)}
                onSuccess={(qty) => onStockDelta(qty)}
              />
            )}
          </td>
        </tr>
      )}
    </>
  )
}
