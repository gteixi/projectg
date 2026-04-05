'use client'

import { type ReactNode, useState, useOptimistic } from 'react'
import { PrepRow } from '@/components/PrepRow'
import { PrepCard } from '@/components/PrepCard'
import { CollapsibleStation } from '@/components/CollapsibleStation'
import { type StockActualHoy, type Station, type ActiveLot } from '@/types/database'
import { SearchInput } from '@/components/SearchInput'
import { STATIONS } from '@/lib/constants'

type StationTheme = {
  accentBorder: string
  accentText: string
  accentBg: string
}

const STATION_THEMES: Record<Station, StationTheme> = {
  Partida:   { accentBorder: 'border-l-orange-500', accentText: 'text-orange-700', accentBg: 'bg-orange-50' },
  Congelador: { accentBorder: 'border-l-blue-500',  accentText: 'text-blue-700',   accentBg: 'bg-blue-50' },
  Camara:    { accentBorder: 'border-l-teal-500',   accentText: 'text-teal-700',   accentBg: 'bg-teal-50' },
  Timbre:    { accentBorder: 'border-l-pink-500',   accentText: 'text-pink-700',   accentBg: 'bg-pink-50' },
}

function itemKey(item: StockActualHoy): string {
  return `${item.production_id}:${item.station}`
}

type OpenMode = 'production' | 'sale' | 'move'
type ActiveItem = { id: string; mode: OpenMode } | null
type StockDelta = { productionId: string; delta: number }

function StationCard({ station, items, lotsByKey, expiredLotsByKey, activeItem, onSetMode, onStockDelta }: {
  station: Station
  items: StockActualHoy[]
  lotsByKey: Record<string, ActiveLot[]>
  expiredLotsByKey: Record<string, ActiveLot[]>
  activeItem: ActiveItem
  onSetMode: (id: string, mode: OpenMode | null) => void
  onStockDelta: (id: string, delta: number) => void
}): React.JSX.Element {
  const theme = STATION_THEMES[station]

  return (
    <CollapsibleStation
      accentBorder={theme.accentBorder}
      accentBg={theme.accentBg}
      accentText={theme.accentText}
      title={station}
      headerRight={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 text-gray-600 text-base font-semibold px-3.5 py-1">
          {items.length} prod.
        </span>
      }
    >
      {items.length === 0 ? (
        <p className="text-center text-gray-400 text-sm italic py-8">Encara no hi ha produccions en aquesta secció</p>
      ) : (
        <>
          <div className="md:hidden">
            {items.map((item) => {
              const key = itemKey(item)
              return (
                <PrepCard
                  key={key}
                  item={item}
                  initialLots={lotsByKey[key] ?? []}
                  expiredLots={expiredLotsByKey[key] ?? []}
                  openMode={activeItem?.id === key ? activeItem.mode : null}
                  onSetMode={(mode) => onSetMode(key, mode)}
                  onStockDelta={(delta) => onStockDelta(key, delta)}
                />
              )
            })}
          </div>
          <div className="hidden md:block px-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e3de]">
                  <th className="py-3 pr-6 text-left text-sm font-semibold uppercase tracking-wider text-gray-400">Producció</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold uppercase tracking-wider text-gray-400">Stock</th>
                  <th className="py-3 pl-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-400 w-[380px]">Registrar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const key = itemKey(item)
                  return (
                    <PrepRow
                      key={key}
                      item={item}
                      initialLots={lotsByKey[key] ?? []}
                      expiredLots={expiredLotsByKey[key] ?? []}
                      openMode={activeItem?.id === key ? activeItem.mode : null}
                      onSetMode={(mode) => onSetMode(key, mode)}
                      onStockDelta={(delta) => onStockDelta(key, delta)}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </CollapsibleStation>
  )
}

export function PrepListClient({ items, lotsByProduction, expiredLotsByProduction, action }: { items: StockActualHoy[]; lotsByProduction: Record<string, ActiveLot[]>; expiredLotsByProduction: Record<string, ActiveLot[]>; action?: ReactNode }): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [activeItem, setActiveItem] = useState<ActiveItem>(null)

  const [optimisticItems, addOptimistic] = useOptimistic(
    items,
    (state: StockActualHoy[], update: StockDelta) =>
      state.map((item) =>
        itemKey(item) === update.productionId
          ? { ...item, stock_total: item.stock_total + update.delta }
          : item
      )
  )

  function handleSetMode(id: string, mode: OpenMode | null): void {
    if (mode === null) setActiveItem(null)
    else setActiveItem({ id, mode })
  }

  function handleStockDelta(id: string, delta: number): void {
    addOptimistic({ productionId: id, delta })
    setActiveItem(null)
  }

  const normalize = (s: string): string =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const hasLotsHere = (i: StockActualHoy): boolean => {
    const key = itemKey(i)
    return i.stock_total > 0
      || (lotsByProduction[key]?.length ?? 0) > 0
      || (expiredLotsByProduction[key]?.length ?? 0) > 0
  }
  const existsElsewhere = (i: StockActualHoy): boolean =>
    optimisticItems.some((other) => other.production_id === i.production_id && other.station !== i.station && hasLotsHere(other))
  const withLots = optimisticItems.filter((i) => hasLotsHere(i) || !existsElsewhere(i))
  const filtered = query.trim()
    ? withLots.filter((i) => normalize(i.name).includes(normalize(query)))
    : withLots

  const grouped = STATIONS.reduce<Record<Station, StockActualHoy[]>>(
    (acc, station) => {
      acc[station] = filtered.filter((i) => i.station === station)
      return acc
    },
    {} as Record<Station, StockActualHoy[]>
  )

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-4 md:text-3xl">Produccions</h1>
      <div className="flex items-center gap-3 mb-6">
        <SearchInput
          value={query}
          onChange={setQuery}
          className="flex-1"
        />
        {action}
      </div>

      <div className="flex flex-col gap-4 md:gap-5">
        {STATIONS.map((station) => (
          <StationCard
            key={station}
            station={station}
            items={grouped[station]}
            lotsByKey={lotsByProduction}
            expiredLotsByKey={expiredLotsByProduction}
            activeItem={activeItem}
            onSetMode={handleSetMode}
            onStockDelta={handleStockDelta}
          />
        ))}
        {query && filtered.length === 0 && (
          <p className="text-center text-gray-400 text-lg py-16">
            Sense resultats per &quot;{query}&quot;
          </p>
        )}
      </div>
    </>
  )
}
