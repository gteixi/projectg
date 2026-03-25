'use client'

import { useState } from 'react'
import { CookBadge } from './CookBadge'

export type LogDetail = {
  lot_number: string | null
  cook_name: string | null
  quantity: number
  unit: string
  time: string
}

type Props = {
  name: string
  reached_par: boolean
  total_produced: number
  par_quantity: number
  unit: string
  lot_count: number
  entries: LogDetail[]
  defaultOpen?: boolean
}

export function HistorialPrepRow({ name, reached_par, total_produced, par_quantity, unit, lot_count, entries, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <li
        className={`grid items-center gap-x-3 px-4 py-3 md:px-6 cursor-pointer select-none transition-colors ${open ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
        style={{ gridTemplateColumns: 'auto 1fr auto auto' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`w-3 h-3 rounded-full ${reached_par ? 'bg-green-600' : 'bg-red-600'}`} />
        <span className="text-base font-medium text-gray-900 min-w-0 truncate">{name}</span>
        <span className="w-14 text-right">
          {lot_count > 0 && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">
              {lot_count} {lot_count === 1 ? 'lot' : 'lots'}
            </span>
          )}
        </span>
        <span className={`text-sm font-semibold tabular-nums text-right w-28 ${reached_par ? 'text-green-700' : 'text-red-700'}`}>
          {total_produced} / {par_quantity} {unit}
        </span>
      </li>

      {open && (
        <li className="bg-gray-50 border-t border-[#e5e3de]">
          <ul className="divide-y divide-[#e5e3de]">
            {entries.map((e, i) => (
              <li key={i} className="px-6 py-2.5 md:px-8">

                {/* Mobile: 2 lines */}
                <div className="md:hidden flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    {e.lot_number
                      ? <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">{e.lot_number}</span>
                      : <span className="h-5 w-16 bg-gray-100 rounded-lg" />
                    }
                    <span className="text-sm tabular-nums text-gray-500">{e.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {e.cook_name
                      ? <CookBadge name={e.cook_name} />
                      : <span className="text-sm text-gray-400">Sense cuiner</span>
                    }
                    <span className="text-sm font-semibold tabular-nums text-gray-800">
                      {e.quantity} {e.unit}
                    </span>
                  </div>
                </div>

                {/* Desktop: 1 line */}
                <div className="hidden md:flex items-center gap-3">
                  {e.lot_number
                    ? <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5 shrink-0">{e.lot_number}</span>
                    : <span className="h-5 w-16 bg-gray-100 rounded-lg shrink-0" />
                  }
                  <span className="shrink-0">
                    {e.cook_name
                      ? <CookBadge name={e.cook_name} />
                      : <span className="text-sm text-gray-400">Sense cuiner</span>
                    }
                  </span>
                  <span className="flex-1" />
                  <span className="text-sm tabular-nums text-gray-500 shrink-0">{e.time}</span>
                  <span className="text-sm font-semibold tabular-nums text-gray-800 shrink-0 w-20 text-right">
                    {e.quantity} {e.unit}
                  </span>
                </div>

              </li>
            ))}
          </ul>
        </li>
      )}
    </>
  )
}
