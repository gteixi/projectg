'use client'

import { useState } from 'react'
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
    return <span className="w-4 h-4 rounded-full bg-green-600 shrink-0 inline-block" />
  if (faltaProducir < parQuantity)
    return <span className="w-4 h-4 rounded-full bg-yellow-500 shrink-0 inline-block" />
  return <span className="w-4 h-4 rounded-full bg-red-600 shrink-0 inline-block" />
}

export function PrepRow({ item }: { item: StockActualHoy }) {
  const [prodOpen, setProdOpen] = useState(false)
  const isDone = item.falta_producir === 0

  return (
    <>
      <tr
        className={`border-b border-[#e5e3de] transition-colors ${
          isDone ? 'bg-green-50 hover:bg-green-100/60' : 'hover:bg-[#fafaf8]'
        }`}
      >
        <td className="py-5 pr-6 align-middle">
          <div className="flex items-center gap-3">
            <Semaforo faltaProducir={item.falta_producir} parQuantity={item.par_quantity} />
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-semibold text-gray-900 leading-tight">{item.name}</span>
              {item.proxima_caducidad && (
                <span className="text-base font-semibold text-red-600 tabular-nums leading-tight">
                  {formatExpiry(item.proxima_caducidad)}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="py-5 px-4 align-middle text-right">
          <span className="text-xl font-bold tabular-nums text-gray-800">{item.stock_total}</span>
          <span className="text-sm text-gray-400 ml-1 max-w-[3rem] truncate inline-block align-middle">{truncUnit(item.unit)}</span>
        </td>
        <td className="py-5 px-4 align-middle text-right whitespace-nowrap">
          <span className="text-base tabular-nums text-gray-400">{item.par_quantity}</span>
          <span className="text-sm text-gray-400 ml-1">{truncUnit(item.unit)}</span>
        </td>
        <td className="py-5 px-4 align-middle text-right whitespace-nowrap">
          {item.falta_producir > 0 ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-base font-semibold tabular-nums">
              −{item.falta_producir} {truncUnit(item.unit)}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-base font-semibold">
              ✓
            </span>
          )}
        </td>
        <td className="py-5 px-4 align-middle">
          <div className="flex justify-center">
            <OpeningInput preparationId={item.preparation_id} unit={item.unit} />
          </div>
        </td>
        <td className="py-5 pl-3 align-middle w-[280px]">
          <div className="flex justify-center">
            <button
              onClick={() => setProdOpen((v) => !v)}
              className={`h-14 px-6 rounded-xl border text-base font-semibold transition-colors ${
                prodOpen
                  ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {prodOpen ? 'Anul·lar' : '+ Produir'}
            </button>
          </div>
        </td>
      </tr>
      {prodOpen && (
        <tr className="border-b border-[#e5e3de] last:border-0 bg-blue-50/50">
          <td colSpan={6} className="px-6 py-4">
            <div className="flex flex-col gap-3">
              <span className="text-base text-gray-500">
                Registrar producció de <strong className="text-gray-900">{item.name}</strong>:
              </span>
              <ProductionButton
                preparationId={item.preparation_id}
                unit={item.unit}
                shelfLifeHours={item.shelf_life_hours}
                variant="form"
                onClose={() => setProdOpen(false)}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
