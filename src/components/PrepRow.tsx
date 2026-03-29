'use client'

import { useState } from 'react'
import { ProductionButton } from './ProductionButton'
import { SalePanel } from './SalePanel'
import { EditPrepModal } from './EditPrepModal'
import { type StockActualHoy, type ActiveLot } from '@/types/database'
import { truncUnit, formatExpiry } from '@/lib/format'

type OpenMode = 'production' | 'sale' | null

export function PrepRow({ item, initialLots, openMode, onSetMode, onStockDelta }: {
  item: StockActualHoy
  initialLots: ActiveLot[]
  openMode: OpenMode
  onSetMode: (mode: OpenMode) => void
  onStockDelta: (delta: number) => void
}): React.JSX.Element {
  const [editing, setEditing] = useState(false)

  function toggle(mode: 'production' | 'sale'): void {
    onSetMode(openMode === mode ? null : mode)
  }

  return (
    <>
      {editing && <EditPrepModal item={item} onClose={() => setEditing(false)} />}
      <tr className="border-b border-[#e5e3de] transition-colors hover:bg-[#fafaf8]">
        <td className="py-5 pr-6 align-middle">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-semibold text-gray-900 leading-tight">{item.name}</span>
              {item.next_expiry && (
                <span className="text-base font-semibold text-red-600 tabular-nums leading-tight">
                  {formatExpiry(item.next_expiry)}
                </span>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 shrink-0 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          </div>
        </td>
        <td className="py-5 px-4 align-middle text-right">
          <span className="text-xl font-bold tabular-nums text-gray-800">{item.stock_total}</span>
          <span className="text-sm text-gray-400 ml-1 max-w-[3rem] truncate inline-block align-middle">{truncUnit(item.unit)}</span>
        </td>
        <td className="py-5 pl-3 align-middle w-[320px]">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => toggle('production')}
              className={`h-14 px-5 rounded-xl border text-base font-semibold transition-colors ${
                openMode === 'production'
                  ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {openMode === 'production' ? 'Anul\u00b7lar' : '+ Produir'}
            </button>
            <button
              onClick={() => toggle('sale')}
              className={`h-14 px-5 rounded-xl border text-base font-semibold transition-colors ${
                openMode === 'sale'
                  ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                  : 'border-red-600 text-red-600 hover:bg-red-50'
              }`}
            >
              {openMode === 'sale' ? 'Anul\u00b7lar' : '- Sale'}
            </button>
          </div>
        </td>
      </tr>
      {openMode && (
        <tr className={`border-b border-[#e5e3de] last:border-0 ${openMode === 'sale' ? 'bg-red-50/50' : 'bg-blue-50/50'}`}>
          <td colSpan={3} className="px-6 py-4">
            {openMode === 'sale' ? (
              <SalePanel
                productionId={item.production_id}
                unit={item.unit}
                stock={item.stock_total}
                initialLots={initialLots}
                onClose={() => onSetMode(null)}
                onSuccess={(qty) => onStockDelta(-qty)}
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
