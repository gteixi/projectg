'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Sidebar } from '@/components/Sidebar'
import { LoteCard, LotResult } from '@/components/LoteCard'

const PAGE_SIZE = 10

type SortKey = 'data' | 'lot'
type SortDir = 'asc' | 'desc'

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function SortButton({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
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

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e3de] px-5 py-4 flex items-center gap-3 animate-pulse">
      <span className="h-6 w-32 bg-blue-50 rounded-lg shrink-0" />
      <span className="h-5 bg-gray-200 rounded flex-1" />
      <span className="h-6 w-20 bg-gray-100 rounded-full shrink-0 hidden sm:block" />
      <span className="h-4 w-4 bg-gray-100 rounded shrink-0" />
    </div>
  )
}

export default function TrazabilidadPage() {
  const [query, setQuery] = useState('')
  const [allResults, setAllResults] = useState<LotResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('data')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [cookFilter, setCookFilter] = useState<string | null>(null)
  const [cookPickerOpen, setCookPickerOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: logs, error: logsErr } = await supabase
        .from('production_logs')
        .select('id, quantity, logged_at, expires_at, batch_number, preparations(name, unit), kitchen_users(name)')
        .eq('type', 'production')
        .not('batch_number', 'is', null)
        .order('logged_at', { ascending: false })
        .limit(500)

      if (logsErr) { setError(logsErr.message); setLoading(false); return }

      setAllResults((logs ?? []).map((log) => {
        const prep = log.preparations as unknown as { name: string; unit: string } | null
        const cook = log.kitchen_users as unknown as { name: string } | null
        return {
          id: log.id,
          lot_number: log.batch_number ?? '',
          preparation_name: prep?.name ?? 'Desconeguda',
          unit: prep?.unit ?? '',
          quantity: log.quantity,
          logged_at: log.logged_at,
          expires_at: log.expires_at,
          cook_name: cook?.name ?? null,
        }
      }))
      setLoading(false)
    }
    load()
  }, [])

  // Reset to page 1 whenever filters/sort change
  useEffect(() => { setPage(1) }, [query, sortKey, sortDir, cookFilter])

  const cookNames = useMemo(
    () => [...new Set(allResults.map((r) => r.cook_name).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'ca')),
    [allResults]
  )

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function selectCook(name: string) {
    setCookFilter((prev) => (prev === name ? null : name))
    setCookPickerOpen(false)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let base = allResults

    if (q) {
      base = base.filter(
        (r) =>
          r.lot_number.toLowerCase().includes(q) ||
          r.preparation_name.toLowerCase().includes(q)
      )
    }

    if (cookFilter) {
      base = base.filter((r) => r.cook_name === cookFilter)
    }

    return [...base].sort((a, b) => {
      const cmp =
        sortKey === 'data'
          ? a.logged_at.localeCompare(b.logged_at)
          : a.lot_number.localeCompare(b.lot_number)
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [query, allResults, sortKey, sortDir, cookFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Lote</h1>
            <p className="text-base text-gray-500 mt-0.5 md:text-lg">Cerca per número de lot o preparació</p>
          </header>

          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="LOT-20260325-001 o nom de preparació…"
              className="w-full h-14 pl-14 pr-4 text-lg border border-[#e5e3de] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
            />
          </div>

          {/* Sort + filter bar */}
          <div className="mb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-sm text-gray-400 shrink-0">Ordenar:</span>
              <SortButton label="Data" active={sortKey === 'data'} dir={sortDir} onClick={() => toggleSort('data')} />
              <SortButton label="Lot" active={sortKey === 'lot'} dir={sortDir} onClick={() => toggleSort('lot')} />

              <span className="w-px h-5 bg-[#e5e3de] shrink-0 mx-1" />

              {/* Cook filter button */}
              <button
                onClick={() => setCookPickerOpen((v) => !v)}
                className={`h-10 px-4 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  cookFilter
                    ? 'bg-blue-600 text-white border-blue-600'
                    : cookPickerOpen
                    ? 'bg-gray-100 text-gray-700 border-[#e5e3de]'
                    : 'bg-white text-gray-600 border-[#e5e3de] hover:bg-gray-50'
                }`}
              >
                {cookFilter ?? 'Cuiner'}
                {cookFilter ? (
                  <span
                    className="ml-0.5 text-blue-200 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); setCookFilter(null); setCookPickerOpen(false) }}
                  >
                    ✕
                  </span>
                ) : (
                  <svg className={`w-3.5 h-3.5 transition-transform ${cookPickerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Cook picker */}
            {cookPickerOpen && cookNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 bg-white border border-[#e5e3de] rounded-xl px-4 py-3">
                {cookNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => selectCook(name)}
                    className={`h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${
                      cookFilter === name
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-[#e5e3de] hover:bg-gray-50'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-base mb-4">{error}</p>}

          {loading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-[#e5e3de] px-6 py-10 text-center">
              <p className="text-gray-400 text-lg">
                {query.trim() || cookFilter
                  ? 'Cap lot trobat amb els filtres aplicats'
                  : 'Sense lots registrats'}
              </p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="flex flex-col gap-3">
                {paginated.map((r) => <LoteCard key={r.id} lot={r} />)}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-12 px-5 rounded-xl border border-[#e5e3de] bg-white text-base font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-gray-500 tabular-nums">
                    {page} / {totalPages}
                    <span className="text-gray-400 ml-1.5">({filtered.length} lots)</span>
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-12 px-5 rounded-xl border border-[#e5e3de] bg-white text-base font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Següent →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
