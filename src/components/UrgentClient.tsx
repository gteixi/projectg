'use client'

import { useState, useMemo } from 'react'
import { LoteCard, type LotResult } from '@/components/LoteCard'
import { SearchInput } from '@/components/SearchInput'

type UrgentLot = LotResult & { bucket: 'critical' | 'warning' | 'tomorrow' }

type CriticalDay = { label: string; lots: UrgentLot[] }

export type UrgentData = {
  criticalDays: CriticalDay[]
  warning: UrgentLot[]
  tomorrow: UrgentLot[]
}

const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function lotMatchesQuery(lot: UrgentLot, q: string): boolean {
  if (normalize(lot.preparation_name).includes(q)) return true
  if (lot.lot_number && normalize(String(lot.lot_number)).includes(q)) return true
  return false
}

export function UrgentClient({ data }: { data: UrgentData }): React.JSX.Element {
  const [query, setQuery] = useState('')
  const q = normalize(query.trim())

  const filtered = useMemo(() => {
    if (!q) return data

    const criticalDays = data.criticalDays
      .map((day) => ({ ...day, lots: day.lots.filter((lot) => lotMatchesQuery(lot, q)) }))
      .filter((day) => day.lots.length > 0)

    return {
      criticalDays,
      warning: data.warning.filter((lot) => lotMatchesQuery(lot, q)),
      tomorrow: data.tomorrow.filter((lot) => lotMatchesQuery(lot, q)),
    }
  }, [data, q])

  const totalLots = filtered.criticalDays.reduce((s, d) => s + d.lots.length, 0) + filtered.warning.length + filtered.tomorrow.length

  return (
    <>
      <SearchInput
        value={query}
        onChange={(v) => setQuery(v)}
        placeholder="Buscar per producció o número de lot…"
        className="mb-4"
      />

      {totalLots === 0 ? (
        <p className="text-center text-gray-400 text-lg py-16">
          {q ? 'Cap resultat trobat' : 'Sense alertes urgents'}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {filtered.criticalDays.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-red-600 mb-3">Caducats</h2>
              {filtered.criticalDays.length === 1 ? (
                <div className="flex flex-col gap-2">
                  {filtered.criticalDays[0].lots.map((lot) => <LoteCard key={lot.id} lot={lot} variant="critical" showSale showExtend showMove />)}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.criticalDays.map((group) => (
                    <details key={group.label} open className="group rounded-xl bg-red-50 px-3 py-2">
                      <summary className="flex items-center justify-between list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden py-1">
                        <span className="text-sm font-semibold text-red-600 capitalize">{group.label} <span className="text-red-400 font-normal">({group.lots.length})</span></span>
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className="text-red-400 transition-transform group-open:rotate-180"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </summary>
                      <div className="flex flex-col gap-2 mt-2">
                        {group.lots.map((lot) => <LoteCard key={lot.id} lot={lot} variant="critical" showSale showExtend showMove />)}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>
          )}
          {filtered.warning.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-600 mb-3">Caduca avui</h2>
              <div className="flex flex-col gap-2">
                {filtered.warning.map((lot) => <LoteCard key={lot.id} lot={lot} variant="warning" showSale showMove />)}
              </div>
            </section>
          )}
          {filtered.tomorrow.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-500 mb-3">Caduca demà</h2>
              <div className="flex flex-col gap-2">
                {filtered.tomorrow.map((lot) => <LoteCard key={lot.id} lot={lot} variant="tomorrow" showSale showMove />)}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
