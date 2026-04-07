'use client'

import { useState, useMemo, useCallback } from 'react'
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

function itemKey(item: DayItem): string {
  if (item.kind === 'prep') return `prep-${item.data.production_id}`
  if (item.kind === 'sale') return `sale-${item.data.exit_id}`
  return `move-${item.data.move_group_id}`
}

export function HistorialClient({ days, today }: { days: DaySummary[]; today: string }): React.JSX.Element {
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

  const initialOpen = useMemo(() => {
    const set = new Set<string>()
    for (const day of days) {
      if (day.date !== today) continue
      for (const item of day.items) set.add(itemKey(item))
    }
    return set
  }, [days, today])

  const [openItems, setOpenItems] = useState<Set<string>>(initialOpen)

  const toggleItem = useCallback((key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleDay = useCallback((day: DaySummary) => {
    setOpenItems((prev) => {
      const keys = day.items.map(itemKey)
      const allOpen = keys.every((k) => prev.has(k))
      const next = new Set(prev)
      for (const k of keys) {
        if (allOpen) next.delete(k)
        else next.add(k)
      }
      return next
    })
  }, [])

  const isItemOpen = useCallback((item: DayItem): boolean => {
    if (q) {
      const lotMatch = isLotQuery && itemHasLotMatch(item, q)
      if (lotMatch) return true
    }
    return openItems.has(itemKey(item))
  }, [openItems, q, isLotQuery])

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
          {filtered.map((day) => {
            const dayKeys = day.items.map(itemKey)
            const allOpen = dayKeys.length > 0 && dayKeys.every((k) => openItems.has(k))
            return (
              <div key={day.date} className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-[#e5e3de] md:px-6 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-base font-semibold text-gray-800 capitalize">{day.label}</h2>
                  {day.items.length > 0 && (
                    <svg
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-gray-400 transition-transform duration-200 ${allOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </button>

                {day.items.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-400 md:px-6">Sense activitat registrada</p>
                ) : (
                  <ul className="divide-y divide-[#e5e3de]">
                    {day.items.map((item) => {
                      const key = itemKey(item)
                      const open = isItemOpen(item)
                      return item.kind === 'prep' ? (
                        <HistorialPrepRow
                          key={key}
                          name={item.data.name}
                          total_produced={item.data.total_produced}
                          unit={item.data.unit}
                          lot_count={item.data.lot_count}
                          entries={item.data.entries}
                          open={open}
                          onToggle={() => toggleItem(key)}
                        />
                      ) : item.kind === 'sale' ? (
                        <HistorialSaleRow
                          key={key}
                          name={item.data.name}
                          unit={item.data.unit}
                          quantity={item.data.quantity}
                          reason={item.data.reason}
                          exitReason={item.data.exitReason}
                          lots={item.data.lots}
                          open={open}
                          onToggle={() => toggleItem(key)}
                        />
                      ) : (
                        <HistorialMoveRow
                          key={key}
                          name={item.data.name}
                          unit={item.data.unit}
                          lot_count={item.data.lot_count}
                          to_station={item.data.to_station}
                          entries={item.data.entries}
                          open={open}
                          onToggle={() => toggleItem(key)}
                        />
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
