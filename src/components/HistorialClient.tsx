'use client'

import { useState, useMemo } from 'react'
import { HistorialPrepRow, type LogDetail } from '@/components/HistorialPrepRow'
import { HistorialSaleRow, type SaleDetail } from '@/components/HistorialSaleRow'
import { HistorialMoveRow, type MoveDetail } from '@/components/HistorialMoveRow'
import { SearchInput } from '@/components/SearchInput'
import { type SaleReason } from '@/types/database'

type PrepSummary = {
  production_id: string
  name: string
  unit: string
  total_produced: number
  lot_count: number
  entries: LogDetail[]
}

type SaleSummary = {
  exit_id: string
  name: string
  unit: string
  quantity: number
  reason: SaleReason
  exitReason: string | null
  lots: SaleDetail[]
}

type MoveSummary = {
  move_group_id: string
  name: string
  unit: string
  lot_count: number
  to_station: string
  entries: MoveDetail[]
}

type DayItem =
  | { kind: 'prep'; sortTime: string; data: PrepSummary }
  | { kind: 'sale'; sortTime: string; data: SaleSummary }
  | { kind: 'move'; sortTime: string; data: MoveSummary }

export type DaySummary = {
  date: string
  label: string
  items: DayItem[]
}

function itemMatchesQuery(item: DayItem, q: string): boolean {
  if (item.kind === 'prep') {
    return item.data.entries.some((e) => e.lot_number && normalize(e.lot_number).includes(q)) ||
      normalize(item.data.name).includes(q)
  }
  if (item.kind === 'move') {
    return item.data.entries.some((e) => normalize(e.batch_number).includes(q)) ||
      normalize(item.data.name).includes(q)
  }
  return item.data.lots.some((l) => normalize(l.batch_number).includes(q)) ||
    normalize(item.data.name).includes(q)
}

function itemHasLotMatch(item: DayItem, q: string): boolean {
  if (item.kind === 'prep') {
    return item.data.entries.some((e) => e.lot_number && normalize(e.lot_number).includes(q))
  }
  if (item.kind === 'move') {
    return item.data.entries.some((e) => normalize(e.batch_number).includes(q))
  }
  return item.data.lots.some((l) => normalize(l.batch_number).includes(q))
}

const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function HistorialClient({ days }: { days: DaySummary[] }): React.JSX.Element {
  const [query, setQuery] = useState('')

  const q = normalize(query.trim())
  const isLotQuery = /^[a-z0-9]+$/i.test(query.trim()) && query.trim().length <= 5

  const filtered = useMemo(() => {
    if (!q) return days
    return days
      .map((day) => ({
        ...day,
        items: day.items.filter((item) => itemMatchesQuery(item, q)),
      }))
      .filter((day) => day.items.length > 0)
  }, [days, q])

  return (
    <>
      <SearchInput
        value={query}
        onChange={(v) => setQuery(v)}
        placeholder="Buscar per producció o número de lot…"
        className="mb-4"
      />

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-lg py-16">
          {q ? 'Cap resultat trobat' : 'Sense activitat registrada'}
        </p>
      ) : (
        <div className="flex flex-col gap-4 md:gap-5">
          {filtered.map((day) => (
            <div key={day.date} className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e5e3de] md:px-6">
                <h2 className="text-base font-semibold text-gray-800 capitalize">{day.label}</h2>
              </div>

              {day.items.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400 md:px-6">Sense activitat registrada</p>
              ) : (
                <ul className="divide-y divide-[#e5e3de]">
                  {day.items.map((item) =>
                    item.kind === 'prep' ? (
                      <HistorialPrepRow
                        key={`prep-${item.data.production_id}`}
                        name={item.data.name}
                        total_produced={item.data.total_produced}
                        unit={item.data.unit}
                        lot_count={item.data.lot_count}
                        entries={item.data.entries}
                        defaultOpen={isLotQuery && q !== '' && itemHasLotMatch(item, q)}
                      />
                    ) : item.kind === 'sale' ? (
                      <HistorialSaleRow
                        key={`sale-${item.data.exit_id}`}
                        name={item.data.name}
                        unit={item.data.unit}
                        quantity={item.data.quantity}
                        reason={item.data.reason}
                        exitReason={item.data.exitReason}
                        lots={item.data.lots}
                        defaultOpen={isLotQuery && q !== '' && itemHasLotMatch(item, q)}
                      />
                    ) : (
                      <HistorialMoveRow
                        key={`move-${item.data.move_group_id}`}
                        name={item.data.name}
                        unit={item.data.unit}
                        lot_count={item.data.lot_count}
                        to_station={item.data.to_station}
                        entries={item.data.entries}
                        defaultOpen={isLotQuery && q !== '' && itemHasLotMatch(item, q)}
                      />
                    )
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
