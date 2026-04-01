'use client'

import { useState, useMemo } from 'react'
import { LoteCard, type LotResult } from '@/components/LoteCard'
import { SearchInput } from '@/components/SearchInput'
import { TRAZABILIDAD_PAGE_SIZE } from '@/lib/constants'

type SortKey = 'data' | 'caducitat' | 'lot'
type SortDir = 'asc' | 'desc'

function SortButton({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-4 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-[#e5e3de] hover:bg-gray-50'
      }`}
    >
      {label}
      {active && (
        <svg className={`w-3.5 h-3.5 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  )
}

interface Props {
  allResults: LotResult[]
}

export function TrazabilidadClient({ allResults }: Props): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('data')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleQueryChange(value: string): void {
    setQuery(value)
    setPage(1)
  }

  function toggleSort(key: SortKey): void {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const normalize = (s: string): string =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    const isNumeric = /^\d+$/.test(q)
    const base = q
      ? allResults.filter(
          (r) =>
            (isNumeric ? r.lot_number?.toString() === q : false) ||
            normalize(r.preparation_name).includes(q)
        )
      : allResults

    return [...base].sort((a, b) => {
      let cmp: number
      if (sortKey === 'data') {
        cmp = a.logged_at.localeCompare(b.logged_at)
      } else if (sortKey === 'caducitat') {
        cmp = (a.expires_at ?? '').localeCompare(b.expires_at ?? '')
      } else {
        cmp = (a.lot_number ?? 0) - (b.lot_number ?? 0)
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [query, allResults, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / TRAZABILIDAD_PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * TRAZABILIDAD_PAGE_SIZE, page * TRAZABILIDAD_PAGE_SIZE)

  return (
    <>
      <SearchInput
        value={query}
        onChange={handleQueryChange}
        className="mb-3"
      />

      <div className="mb-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-sm text-gray-400 shrink-0 hidden md:inline">Ordenar:</span>
        <SortButton label="Data producció" active={sortKey === 'data'} dir={sortDir} onClick={() => toggleSort('data')} />
        <SortButton label="Data caducitat" active={sortKey === 'caducitat'} dir={sortDir} onClick={() => toggleSort('caducitat')} />
        <SortButton label="Lot" active={sortKey === 'lot'} dir={sortDir} onClick={() => toggleSort('lot')} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e3de] px-6 py-10 text-center">
          <p className="text-gray-400 text-lg">
            {query.trim() ? 'Cap lot trobat amb els filtres aplicats' : 'Sense lots registrats'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {paginated.map((r) => <LoteCard key={r.id} lot={r} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-12 px-3 sm:px-5 rounded-xl border border-[#e5e3de] bg-white text-sm sm:text-base font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                ← Anterior
              </button>
              <span className="text-xs sm:text-sm text-gray-500 tabular-nums text-center min-w-0">
                {page} / {totalPages}
                <span className="hidden sm:inline text-gray-400 ml-1.5">({filtered.length} lots)</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-12 px-3 sm:px-5 rounded-xl border border-[#e5e3de] bg-white text-sm sm:text-base font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Següent →
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
