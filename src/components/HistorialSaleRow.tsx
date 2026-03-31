'use client'

import { useState } from 'react'
import { REASON_LABELS } from '@/lib/constants'
import { type SaleReason } from '@/types/database'

export type SaleDetail = {
  batch_number: number
  quantity: number
  time: string
}

type Props = {
  name: string
  unit: string
  quantity: number
  reason: SaleReason
  lots: SaleDetail[]
  defaultOpen?: boolean
}

export function HistorialSaleRow({ name, unit, quantity, reason, lots, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <li
        className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 px-4 py-3 md:px-6 cursor-pointer select-none transition-colors ${open ? 'bg-red-50' : 'hover:bg-red-50'}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-base font-medium text-gray-900 truncate">{name}</span>
          <span className="text-xs font-semibold text-red-700 bg-red-100 rounded-full px-2 py-0.5 whitespace-nowrap shrink-0">
            {REASON_LABELS[reason] ?? reason}
          </span>
        </div>
        <span className="w-14 text-right">
          {lots.length > 0 && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">
              {lots.length} {lots.length === 1 ? 'lot' : 'lots'}
            </span>
          )}
        </span>
        <span className="text-sm font-semibold tabular-nums text-right w-28 text-red-600">
          -{quantity} {unit}
        </span>
      </li>

      {open && lots.length > 0 && (
        <li className="bg-red-50 border-t border-red-100">
          <ul className="divide-y divide-red-100">
            {lots.map((l, i) => (
              <li key={i} className="px-6 py-2.5 md:px-8 flex items-center gap-3">
                <span className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-gray-500">Lote</span>
                  <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">#{l.batch_number}</span>
                </span>
                <span className="flex-1" />
                <span className="text-sm tabular-nums text-gray-500 shrink-0">{l.time}</span>
                <span className="text-sm font-semibold tabular-nums text-red-700 shrink-0 w-20 text-right">
                  -{l.quantity} {unit}
                </span>
              </li>
            ))}
          </ul>
        </li>
      )}
    </>
  )
}
