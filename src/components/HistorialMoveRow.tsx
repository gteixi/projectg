'use client'

import { useState } from 'react'

export type MoveDetail = {
  batch_number: string
  quantity: number
  from_station: string
  to_station: string
  time: string
}

type Props = {
  name: string
  unit: string
  lot_count: number
  to_station: string
  entries: MoveDetail[]
  defaultOpen?: boolean
}

export function HistorialMoveRow({ name, unit, lot_count, to_station, entries, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <li
        className={`grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[12px_1fr_56px_112px] items-center gap-x-1.5 md:gap-x-3 px-4 py-3 md:px-6 cursor-pointer select-none transition-colors ${open ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="w-3 h-3 rounded-full bg-blue-400" />
        <span className="text-base font-medium text-gray-900 truncate min-w-0">{name}</span>
        <span className="w-10 md:w-14 text-right md:text-left">
          {lot_count > 0 && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">
              {lot_count} {lot_count === 1 ? 'lot' : 'lots'}
            </span>
          )}
        </span>
        <span className="text-sm font-semibold text-right w-20 md:w-28 text-blue-600 truncate">
          → {to_station}
        </span>
      </li>

      {open && entries.length > 0 && (
        <li className="bg-blue-50 border-t border-blue-100">
          <ul className="divide-y divide-blue-100">
            {entries.map((e, i) => (
              <li key={i} className="px-4 py-2.5 md:px-8 flex items-center gap-2 md:gap-3">
                <span className="flex items-center gap-1 md:gap-2 min-w-0 flex-1 overflow-hidden">
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-500">Lote</span>
                    <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">#{e.batch_number}</span>
                  </span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5 truncate">
                    {e.from_station} → {e.to_station}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-gray-500 shrink-0">{e.time}</span>
                <span className="text-sm font-semibold tabular-nums text-gray-700 shrink-0 w-20 text-right">
                  {e.quantity} {unit}
                </span>
              </li>
            ))}
          </ul>
        </li>
      )}
    </>
  )
}
