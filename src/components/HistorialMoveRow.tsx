'use client'

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
  open: boolean
  onToggle: () => void
}

export function HistorialMoveRow({ name, unit, lot_count, to_station, entries, open, onToggle }: Props) {

  return (
    <>
      <li
        className={`grid grid-cols-[auto_1fr_56px_112px] md:grid-cols-[12px_1fr_56px_112px] items-center gap-x-3 px-4 py-3 md:px-6 cursor-pointer select-none transition-colors ${open ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
        onClick={onToggle}
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
        <span className="text-sm font-semibold text-blue-600 text-right truncate">
          → {to_station}
        </span>
      </li>

      {open && entries.length > 0 && (
        <li className="bg-blue-50 border-t border-blue-100">
          <ul className="divide-y divide-blue-100">
            {entries.map((e, i) => (
              <li key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-4 py-2.5 md:px-8 overflow-hidden">
                <span className="flex items-center gap-1 min-w-0 overflow-hidden">
                  <span className="text-xs text-gray-500 shrink-0">Lote</span>
                  <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5 shrink-0">#{e.batch_number}</span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5 truncate">
                    {e.from_station} → {e.to_station}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-gray-500 whitespace-nowrap">{e.time}</span>
                <span className="text-sm font-semibold tabular-nums text-gray-700 whitespace-nowrap text-right w-20">
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
