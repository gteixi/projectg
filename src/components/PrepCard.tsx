'use client'

import { OpeningInput } from './OpeningInput'
import { ProductionButton } from './ProductionButton'
import { StockActualHoy } from '@/types/database'
import { truncUnit } from '@/lib/format'

function formatExpiry(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const time = date.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
  if (date.toDateString() === now.toDateString()) return `cad. ${time}`
  if (date.toDateString() === new Date(now.getTime() + 86400000).toDateString())
    return `cad. demà ${time}`
  return `cad. ${date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })} ${time}`
}

function Semaforo({ faltaProducir, parQuantity }: { faltaProducir: number; parQuantity: number }) {
  if (faltaProducir === 0)
    return <span className="w-4 h-4 rounded-full bg-green-600 shrink-0 inline-block" title="OK" />
  if (faltaProducir < parQuantity)
    return <span className="w-4 h-4 rounded-full bg-yellow-500 shrink-0 inline-block" title="Parcial" />
  return <span className="w-4 h-4 rounded-full bg-red-600 shrink-0 inline-block" title="Pendent" />
}

export function PrepCard({ item }: { item: StockActualHoy }) {
  const isDone = item.falta_producir === 0

  return (
    <div className={`p-4 border-b border-[#e5e3de] last:border-0 ${isDone ? 'bg-green-50' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Semaforo faltaProducir={item.falta_producir} parQuantity={item.par_quantity} />
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900 leading-tight">{item.name}</div>
            {item.proxima_caducidad && (
              <div className="text-sm font-semibold text-red-600 tabular-nums leading-tight">
                {formatExpiry(item.proxima_caducidad)}
              </div>
            )}
          </div>
        </div>
        {item.falta_producir > 0 ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold tabular-nums shrink-0">
            −{item.falta_producir} {truncUnit(item.unit)}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold shrink-0">
            ✓
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 text-sm text-gray-500 mb-3">
        <span>Stock: <strong className="text-gray-800 tabular-nums">{item.stock_total} {truncUnit(item.unit)}</strong></span>
        <span>Par: <strong className="text-gray-500 tabular-nums">{item.par_quantity} {truncUnit(item.unit)}</strong></span>
      </div>
      <div className="flex flex-col gap-2">
        <OpeningInput preparationId={item.preparation_id} unit={item.unit} />
        <ProductionButton
          preparationId={item.preparation_id}
          unit={item.unit}
          shelfLifeHours={item.shelf_life_hours}
        />
      </div>
    </div>
  )
}
