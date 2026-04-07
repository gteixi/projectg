'use client'

import { useState } from 'react'
import { REASON_LABELS, EXIT_REASON_LABELS } from '@/lib/constants'
import { type SaleReason, type ExitReason } from '@/types/database'

export type SaleDetail = {
  batch_number: string
  quantity: number
  time: string
}

type Props = {
  name: string
  unit: string
  quantity: number
  reason: SaleReason
  exitReason?: string | null
  lots: SaleDetail[]
  defaultOpen?: boolean
}

export function HistorialSaleRow({ name, unit, quantity, reason, exitReason, lots, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <li
        className={`grid grid-cols-[auto_1fr_56px_112px] md:grid-cols-[12px_1fr_56px_112px] items-center gap-x-3 px-4 py-3 md:px-6 cursor-pointer select-none transition-colors ${open ? 'bg-red-50' : 'hover:bg-red-50'}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="text-base font-medium text-gray-900 truncate min-w-0">{name}</span>
        <span className="w-10 md:w-14 text-right md:text-left">
          {lots.length > 0 && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">
              {lots.length} {lots.length === 1 ? 'lot' : 'lots'}
            </span>
          )}
        </span>
        <span className="text-sm font-semibold tabular-nums text-right text-red-600 whitespace-nowrap">
          -{quantity} {unit}
        </span>
      </li>

      {open && lots.length > 0 && (
        <li className="bg-red-50 border-t border-red-100">
          <ul className="divide-y divide-red-100">
            {lots.map((l, i) => (
              <li key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-4 py-2.5 md:px-8 overflow-hidden">
                <span className="flex items-center gap-1 min-w-0 overflow-hidden">
                  <span className="text-xs text-gray-500 shrink-0">Lote</span>
                  <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5 shrink-0">#{l.batch_number}</span>
                  <span className="text-xs font-semibold text-red-700 bg-red-100 rounded-full px-2 py-0.5 truncate">
                    {REASON_LABELS[reason] ?? reason}{exitReason && exitReason in EXIT_REASON_LABELS ? ` → ${EXIT_REASON_LABELS[exitReason as ExitReason]}` : ''}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-gray-500 whitespace-nowrap">{l.time}</span>
                <span className="text-sm font-semibold tabular-nums text-red-700 whitespace-nowrap text-right w-20">
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
