'use client'

import { useState } from 'react'

export type LogDetail = {
  lot_number: string | null
  quantity: number
  unit: string
  time: string
}

type Props = {
  name: string
  total_produced: number
  unit: string
  lot_count: number
  entries: LogDetail[]
  defaultOpen?: boolean
}

export function HistorialPrepRow({ name, total_produced, unit, lot_count, entries, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <li
        className={`grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[12px_1fr_56px_112px] items-center gap-x-1.5 md:gap-x-3 px-4 py-3 md:px-6 cursor-pointer select-none transition-colors ${open ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="w-3 h-3 rounded-full bg-gray-400" />
        <span className="text-base font-medium text-gray-900 min-w-0 truncate">{name}</span>
        <span className="w-10 md:w-14 text-right md:text-left">
          {lot_count > 0 && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">
              {lot_count} {lot_count === 1 ? 'lot' : 'lots'}
            </span>
          )}
        </span>
        <span className="text-sm font-semibold tabular-nums text-right w-20 md:w-28 text-gray-700">
          {total_produced} {unit}
        </span>
      </li>

      {open && (
        <li className="bg-gray-50 border-t border-[#e5e3de]">
          <ul className="divide-y divide-[#e5e3de]">
            {entries.map((e, i) => (
              <li key={i} className="px-6 py-2.5 md:px-8 flex items-center gap-3">
                {e.lot_number
                  ? <span className="flex items-center gap-1 shrink-0"><span className="text-xs text-gray-500">Lote</span><span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">#{e.lot_number}</span></span>
                  : <span className="h-5 w-16 bg-gray-100 rounded-lg shrink-0" />
                }
                <span className="flex-1" />
                <span className="text-sm tabular-nums text-gray-500 shrink-0">{e.time}</span>
                <span className="text-sm font-semibold tabular-nums text-gray-800 shrink-0 w-20 text-right">
                  {e.quantity} {e.unit}
                </span>
              </li>
            ))}
          </ul>
        </li>
      )}
    </>
  )
}
